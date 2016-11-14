import {getByKeyPath as readKey} from './utils';
import {IQuery} from './iquery';

const operators = {
    above: (a,b,cmp) => cmp(a,b) > 0,
    aboveOrEqual: (a,b,cmp) => cmp(a,b) >= 0,
    anyOf: (a,b,cmp) => b && b.some(x => operators.equals(a, x, cmp)),
    anyOfIgnoreCase: (a,b,cmp) => b && b.some(x => operators.equalsIgnoreCase(a, x, cmp)),
    below: (a,b,cmp) => cmp(a,b) < 0,
    belowOrEqual: (a,b,cmp) => cmp(a,b) <= 0,
    between: (a,b:{0,1,2?,3?},cmp) => {
        let aboveCmp = cmp(a,b[0]),
            belowCmp = cmp(a,b[1]),
            inclLowr = b[2] === undefined || b[2],
            inclUppr = b[3] === undefined || b[3], // Not backward compatible though
            aboveOk = inclLowr ? aboveCmp >= 0 : aboveCmp > 0,
            belowOk = inclUppr ? belowCmp <= 0 : belowCmp < 0;
        return aboveOk && belowOk;
    },
    equals: (a,b,cmp) => cmp(a,b) === 0,
    equalsIgnoreCase: (a,b,cmp) => a.toLowerCase() === b.toLowerCase(),
    inAnyRange: (a,b,cmp) => b.some(range => operators.between(a, range, cmp)), // Must fix options
    noneOf: (a,b,cmp) => !operators.anyOf(a,b,cmp), //Thought here: Need to support and require non-sparse indexes for noneOf
            /* db.version(1).stores({
                friends: '++id, isBestFriend!'
            })
                om key not indexable, tolka om till "\uffff" + JSON.stringify(key)
                om key is array, for each array item, kolla samma.
            */
}

export class QueryTester {
    value;
    constructor (value) {
        this.value = value;
    }

    test(query: IQuery | null) : boolean {
        if (!query) return true;
        let op = query.op;
        if (!this[op]) return this.test(query.down); // Ignore stuff like map etc.
        let rv = this[op](query.down, query.data);
        if (!rv) return false;
        return this.test(query.down);
    }

    above(query, criteria: {keyPath: string, value: any}) {
        return readKey(this.value, criteria.keyPath) > criteria.value;
    }
    // alla whereclauses likadant
    // + or + and
    // + filter
    // + ignorera allt annat.
}
