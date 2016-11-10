import {Collection, Enumerable, WhereClause, Expression} from './collection';

export enum ResultType {
    Values = 1,
    PrimaryKeys = 2,
    Keys = 4
}

class DefaultEngine {
    wantsArray = false;
    resultType = ResultType.Values;
    _limit = Infinity;

    constructor() {
        this.wantsArray = false;
        this.resultType = 1; // 1 = Values, 2 = PrimaryKeys, 4 = Keys.
        this.limit = Infinity;
        this.cancelled = false;
        this.reversed = false;
    }

    limit (fn, coll, num) {
        this.limit = num;
        return this[coll.op](x => num-- ? fn(x) : this.cancel(), coll.parent, coll.data);
    }

    reverse (fn, coll) {
        this.reversed = true;
        let wantedArray = this.wantsArray;
        return this.toArray(a => {
            a.reverse();
            if (wantedArray) return a;
            a.forEach(a => fn(a));
        });
    }

    cancel() {
        this.cancelled = true;
    }

    each(coll, onNext) {
        return this[coll.op](x => onNext(x), coll.parent, coll.data);
    }

    toArray (coll) {
        let a = [];
        this.wantsArray = true;
        return this[coll.op](x => a.push(x), coll.parent, coll.data).then(_a => {
            return _a || a;
        });
    }

    map (fn, coll, mapperFn) {
        return this[coll.op](x => fn(mapperFn(x)), coll.parent, coll.data)
            .then (a = a && a.map(mapperFn));
    }

    keys (fn, coll) {
        this.wantsKeys = true;
        return this[coll.op](fn, coll.parent, coll.data);
    }


}