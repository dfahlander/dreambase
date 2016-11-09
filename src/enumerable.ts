interface Enumerable<T> {
    each (onNext: (T)=>any) : Promise<any>;
    toArray () : Promise<T[]>;
    map<TMapped> (mapperFn: (T) => TMapped | Promise<TMapped>) : Enumerable<TMapped>;
    filter(filterFn: (T) => boolean | Promise<boolean>) : Enumerable<T>;
    count() : Promise<number>;
    reverse() : Enumerable<T>;
    first() : Promise<T>;
    last() : Promise<T>;
    offset(offset : number) : Enumerable<T>;
    until() : Enumerable<T>;
}

/*abstract class Enumerable<T> {
    parent: Enumerable<any>;
    op: string;
    args: any[];

    constructor (parent, op, args) {
        this.parent = parent;
        this.op = op;
        this.args = args;
    }

    abstract _create (op, ...args) : Collection;

    abstract each (fn) : Promise<any>;

    abstract toArray (fn) : Promise<any>;    
}
*/


export default Enumerable;
