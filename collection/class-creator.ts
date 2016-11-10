import {Collection, WhereClause} from './interfaces';
import {IQuery} from './data-contract'


interface Provider<T, TPrimaryKey> {
    Collection: new ()=>Collection<T, TPrimaryKey>;
    WhereClause: new ()=>WhereClause<T, TPrimaryKey>;
}

type QueryExecutor = (query: IQuery, onNext: Function) => Promise<any>;

/** This function 
 * 
 */
export default function createProvider<T, TPrimaryKey> (executeQuery : QueryExecutor) : Provider<T, TPrimaryKey> {
    
    function WhereClause (collection, indexName, op?) {
        this.coll = collection;
        this.index = indexName;
        this.op = op;
    }

    const operators = {
        above: {},
        aboveOrEqual: {},
        anyOf: {m:1},
        anyOfIgnoreCase: {m:1,s:1},
        below: {},
        belowOrEqual: {},
        between: {m:1},
        equals: {},
        equalsIgnoreCase: {s:1},
        inAnyRange: {m:1},
        noneOf: {m:1},
        notEqual: {},
        startsWith: {s:1},
        startsWithAnyOf: {s:1,m:1},
        startsWithIgnoreCase: {s:1},
        startsWithAnyOfIgnoreCase: {s:1,m:1}
    };

    Object.keys(operators).forEach(op => {
        let spec = operators[op];
        WhereClause.prototype[op] = spec.m ? function () {
            let args = new Array(arguments.length);
            let i = arguments.length;
            while (i--) {
                // TODO: Use getArrayOf()!
                let arg = arguments[1];
                if (spec.s && typeof arg !== 'string')
                    throw new TypeError (`Invalid argument passed to WhereClause.${op}. Arguments must be strings.`);
                args[i] = arguments[i];
            }
            let rv = new WhereExpression(this.coll, this.index, op, args);
            return this.op ? new CombinedExpression(this.coll, this.op, rv) : rv;
        } : function (val) {
            if (spec.s && typeof val !== 'string')
                throw new TypeError (`Invalid argument passed to WhereClause.${op}. Argument must be a string.`);
            let rv = new WhereExpression(this.coll, this.index, op, val);
            return this.op ? new CombinedExpression(this.coll, this.op, rv) : rv;
        }
    });

    /*const enumerableMethods = [
        'map',
        'filter',

    ]*/
 
    class Collection implements IQuery {
        parent: IQuery | null;
        op: string;
        data: any;        

        constructor(parent?, op?, data?) {
            this.parent = parent;
            this.op = op || "enumerate";
            this.data = data;
        }

        each (onNext : Function) {
            return executeQuery(this, onNext);
        }

        toArray(cb?) {
            return executeQuery(new Collection(this, "toArray"), ()=>{}).then(cb);
        }

        map (fn) {
            return new Collection(this, "map", fn);
        }

        limit(num) {
            return new Collection(this, "limit", num);
        }

        reverse() {
            return new Collection(this, "reverse"); 
        }

        orderBy(keyPath: string) {
            return new Collection(this, "orderBy", keyPath);
        }

        keys() {
            return new Collection(this, "keys").toArray();
        }

        where(keyPath: string) {
            return new WhereClause(this, keyPath, this.parent ? 'and' : null);
        }

        first(cb?) {
            return this.limit(1).toArray(a => a[0]).then(cb);
        }

        last(cb?) {
            return this.reverse().limit(1).toArray(a => a[0]).then(cb);
        }

    }

    class WhereExpression extends Collection {
        keyPath: string;

        constructor (parent, keyPath, op, value) {
            super(parent, op, value);
            this.keyPath = keyPath;
        }

        or (keyPath: string) {
            return new WhereClause(this, keyPath, 'or');
        }
    }

    class CombinedExpression extends Collection {

        or (keyPath: string) {
            return new WhereClause(this, keyPath, 'or');
        }
    }

    let p : {0: Provider<T, TPrimaryKey>} = {};
    (p as any)[0] = {
        Collection: Collection,
        WhereClause: WhereClause
    };
    return p[0];
}
