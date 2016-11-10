import {Enumerable, Collection, Expression, WhereClause} from './collection';

/*interface QueryEngine {
    execute (onNext: (any)=>any, coll: Enumerable<any>) : Promise<any>;
    toArray? (coll: Enumerable<any>) : Promise<any[]>;
    offset(coll: Enumerable<any>, offset : number) :
}*/

export enum ResultType {
    Values = 1,
    PrimaryKeys = 2,
    Keys = 4
}

export interface ExecutableEnumerable extends Enumerable<any> {
    parent: ExecutableEnumerable;
    op: string;
    data: any;
}

export interface ExecutableCollection extends Collection<any, any>, ExecutableEnumerable {
    parent: ExecutableCollection;
    op: string;
    data: any;
}

export interface ExecutableExpression extends Expression<any, any>, ExecutableCollection {
    parent: ExecutableExpression,
    op: string;
    lvalue: any;
    rvalue: any;
}

abstract class AbstractQueryEngine {
    _wantsArray = false;
    _resultType = ResultType.Values;
    _limit = Infinity;
    _cancelled = false;
    _reversed = false;

    abstract execute (onNext, x : ExecutableEnumerable) : Promise<any>;

    limit (fn, coll, num) {
        this.limit = num;
        return this[coll.op](x => num-- ? fn(x) : this.cancel(), coll.parent, coll.data);
    }

    reverse (fn, coll) {
        this._reversed = true;
        let wantedArray = this._wantsArray;
        return this.toArray(coll).then(a => {
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
        this._wantsArray = true;
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