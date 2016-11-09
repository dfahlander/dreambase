import Enumerable from './enumerable';
import WhereClause from './whereclause';

interface Collection<T, TPrimaryKey> extends Enumerable<T> {
    distinct() : Collection<T, TPrimaryKey>;
    eachKey(onNextKey: (any)=>any) : Promise<any>;
    eachPrimaryKey(onNextKey: (TPrimaryKey)=>any) : Promise<any>;
    eachUniqueKey(onNextKey: (any)=>any) : Promise<any>;
    keys() : Promise<any[]>;
    primaryKeys() : Promise<TPrimaryKey[]>;
    uniqueKeys() : Promise<any[]>;
    where (key : string) : WhereClause<T, TPrimaryKey>;
}

/*abstract class Collection<T, Key> {
    parent: Collection<any, Key>;
    op: string;

    constructor (parent, op) {
        this.parent = parent;
        this.op = op;
    }

    abstract _create (op, ...args) : Collection;

    abstract each (onNext: (T)=>any) : Promise<any>;

    abstract toArray (fn) : Promise<T[]>;
}*/



export default Collection;
