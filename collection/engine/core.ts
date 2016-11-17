import {getByKeyPath, isArray, keys} from '../utils';
import {IQuery} from './iengine';

const cmpOrder = {number: 1, object: 2, undefined: 3, boolean: 4, string: 5};

// IndexedDB compatible cmp, with extended support for null, undefined, boolean and objects,
// as it would work if emulating non-sparse indexes by using "\u0000" + JSON.stringify(value).
export function cmp (a,b) {
    return isArray(a) ?
        isArray(b) ?
            a.reduce((rv, val, i) => rv ? rv : cmp(val, b[i]), 0) :
            1 :
        typeof a === typeof b ?
            typeof a === 'object' ?
                cmp(JSON.stringify(a), JSON.stringify(b)) :
                a < b ? -1 : a > b ? 1 : 0 :
            cmp (cmpOrder[typeof a], cmpOrder[typeof b]) 
}

class MyWhereClause extends WhereClause {}

MyWhereClause.defineOperators({
    equalsIgnoreCase: ['s','s', (x,arg) => x.toLowerCase() == arg.toLowerCase()],
    noneOf: ['','', (x, args) => !WhereClause.anyOf (x, args)]
});

function compareBasedComputedIndex (str, comparer: (a:string,b:string) => number) {
    // 1. Skapa mappningslista mellan hela unicode-tabellen och ett ordnat char i resultatet.
    // a = 1, b = 2, ..., z = 25, å = 26, ä = 27, ö = 28
    // Hur skapa sån tabell från comparer?

    // Skapa tabell (görs i en init)
    const a = new Array(65536);
    for (let i=0;i<65536;++i) a[i] = String.fromCharCode(i);
    a.sort(comparer);
    const table = {};
    for (let i=0;i<65536;++i) {
        let ch = a[i],
            pos = i;
        table[ch] = pos;
    }

    // Köra funktionen:
    const len = str.length;
    const result = new Array(len);
    for (let i=0;i<len;++i) result[i] = table[str[i]];
    return result.join('');
}
// Ovanstående metod extremt långsam. Tar sekunder.
// Försökt mig på en alternativ metod som jag inte vet om den funkar:
function doit(comparer) {
    const table = {};
    const a = [String.fromCharCode(0)];
    for (let i=1;i<65536;++i) {
        let last = a[i-1], curr = String.fromCharCode(i);
        if (comparer(curr, last) < 0) {
            table[curr] = -1;
            for (let j=1;j < i;++j) {
                let back = String.fromCharCode(i-j);
                if (comparer(curr, back) >= 0) break;
                table[back] = (table[back] ? table[back] + 1 : 1);
            }
        }
    }
    //alert (JSON.stringify(table))
}
// Men den var inte hypersnabb den heller.


export const whereFunctions = {
    above (a,b) {return cmp(a,b) > 0},
    aboveOrEqual (a,b) {return cmp(a,b) >= 0},
    anyOf (a,b) {return b.some(x => this.equals(a, x))},
    anyOfIgnoreCase (a,b) { return b && b.some(x => this.equalsIgnoreCase(a, x))},
    below (a,b) {return cmp(a,b) < 0},
    belowOrEqual (a,b) {return cmp(a,b) <= 0},
    between (a,b:{0,1,2?:boolean,3?:boolean}) {
        let aboveCmp = cmp(a,b[0]),
            belowCmp = cmp(a,b[1]),
            inclLowr = b[2] === undefined || b[2],
            inclUppr = b[3] === undefined || b[3], // Not backward compatible though
            aboveOk = inclLowr ? aboveCmp >= 0 : aboveCmp > 0,
            belowOk = inclUppr ? belowCmp <= 0 : belowCmp < 0;
        return aboveOk && belowOk;
    },
    equals (a,b) {return cmp(a,b) === 0},
    equalsIgnoreCase (a,b:string) { return typeof a === 'string' && a.toLowerCase() === b.toLowerCase() },
    inAnyRange (a, b:{}) {return b[0].some(range => this.between(
        a,
        range,
        b[1] && b[1].includeLowers,
        b[1] && b[1].includeUppers))
    },
    noneOf (a,b) {return !this.anyOf(a,b)}, //Thought here: Need to support and require non-sparse indexes for noneOf
            /* db.version(1).stores({
                friends: '++id, isBestFriend!'
            })
                om key not indexable, tolka om till "\uffff" + (key === undefined ? "" : JSON.stringify(key))
                om key is array, for each array item, kolla samma.
            */
    notEqual (a,b) {return !this.equals(a,b)},
    startsWith (a,b:string) {
        return typeof a === 'string' && a.indexOf(b) === 0},
    startsWithAnyOf (a,b:string[]) {
        return typeof a === 'string' && b.some(prefix => a.indexOf(prefix) === 0)},
    startsWithIgnoreCase (a,b:string) {
        return typeof a === 'string' && this.startsWith(a.toLowerCase(), b.toLowerCase())},
    startsWithAnyOfIgnoreCase (a,b:string[]) {
        return typeof a === 'string' &&
            b.some(prefix => a.toLowerCase().indexOf(prefix.toLowerCase()) === 0)
    },
}

export function testSingleValue (query: IQuery, objToTest: Object) : boolean {
    if (!query) return true;
    let op = query.op;
    if (!singleValueEngine[op]) return test(query.down, objToTest); // Ignore stuff like map etc.
    return singleValueEngine[op](query.down, objToTest, query.data);
}

const queryTester = {
    test(query: IQuery | null, objToTest) : boolean {
        if (!query) return true;
        let op = query.op;
        if (!this[op]) return this.test(query.down, objToTest); // Ignore stuff like map etc.
        return this[op](query.down, objToTest, query.data);
    },
    // alla whereFunctions likadan signatur (macro nedan)
    // + or + and
    // + filter
    // + ignorera allt annat.

    or (downQuery, objToTest, rightQuery) {
        return this.test(downQuery, objToTest) || this.test(rightQuery, objToTest);
    },

    and (downQuery, objToTest, rightQuery) {
        return this.test(downQuery, objToTest) && this.test(rightQuery, objToTest);
    },

    filter (downQuery, objToTest, filterFn) {
        return filterFn(objToTest) && this.test(downQuery, objToTest);
    }
}

keys (whereFunctions).forEach(op => {
    return function (downQuery, objToTest, criteria: {keyPath: string, value: any}) {
        return whereFunctions[op](getByKeyPath(objToTest, criteria.keyPath), criteria.value) &&
            this.test(downQuery, objToTest);
    }
});
