import {getByKeyPath, isArray, keys} from './utils';
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

const whereFunctions = {
    above (a,b) {return cmp(a,b) > 0},
    aboveOrEqual (a,b) {return cmp(a,b) >= 0},
    anyOf (a,b) {return b.some(x => this.equals(a, x))},
    anyOfIgnoreCase (a,b) { return b && b.some(x => this.equalsIgnoreCase(a, x))},
    below (a,b) {return cmp(a,b) < 0},
    belowOrEqual (a,b) {return cmp(a,b) <= 0},
    between (a,b:{0,1,2?,3?}) {
        let aboveCmp = cmp(a,b[0]),
            belowCmp = cmp(a,b[1]),
            inclLowr = b[2] === undefined || b[2],
            inclUppr = b[3] === undefined || b[3], // Not backward compatible though
            aboveOk = inclLowr ? aboveCmp >= 0 : aboveCmp > 0,
            belowOk = inclUppr ? belowCmp <= 0 : belowCmp < 0;
        return aboveOk && belowOk;
    },
    equals (a,b) {return cmp(a,b) === 0},
    equalsIgnoreCase (a,b) { return a.toLowerCase() === b.toLowerCase() },
    inAnyRange (a,b) { return b.some(range => this.between(a, range))}, // Must fix options
    noneOf (a,b) {return !this.anyOf(a,b)}, //Thought here: Need to support and require non-sparse indexes for noneOf
            /* db.version(1).stores({
                friends: '++id, isBestFriend!'
            })
                om key not indexable, tolka om till "\uffff" + (key === undefined ? "" : JSON.stringify(key))
                om key is array, for each array item, kolla samma.
            */
    notEqual (a,b) {return !this.equals(a,b)},
    startsWith (a,b) {return a.indexOf(b) === 0},
    startsWithAnyOf (a,b) {return b.some(prefix => a.indexOf(prefix) === 0)},
    startsWithIgnoreCase (a,b) {return this.startsWith(a.toLowerCase(), b.toLowerCase())},
    startsWithAnyOfIgnoreCase (a,b) {return b.some(prefix => a.toLowerCase().indexOf(prefix.toLowerCase()) === 0)},
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
