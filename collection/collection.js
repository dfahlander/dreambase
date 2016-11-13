import {NO_CHAR_ARRAY, getArrayOf, keys} from './utils';

/*import {ICollection, IExpression, IEnumerable, IWhereClause} from './icollection';
import {IQuery} from './iquery'

interface CollectionProvider<T, TPrimaryKey> {
    Collection: new ()=>ICollection<T, TPrimaryKey>;
    WhereClause: new ()=>IWhereClause<T, TPrimaryKey>;
}

type QueryExecutor = (query: IQuery, onNext?: Function) => Promise<any>;
*/



/** This function 
 * 
 */
export default function createCollectionClass (QueryExecutor) {
    
    function WhereClause (collection, keyPath, op) {
        this.coll = collection;
        this.keyPath = keyPath;
        this.op = op;
    }

    const operators = {
        above: '',
        aboveOrEqual: '',
        anyOf: 'm',
        anyOfIgnoreCase: 'ms',
        below: '',
        belowOrEqual: '',
        between: 'm',
        equals: '',
        equalsIgnoreCase: 's',
        inAnyRange: 'm',
        noneOf: 'm',
        notEqual: '',
        startsWith: 's',
        startsWithAnyOf: 'ms',
        startsWithIgnoreCase: 's',
        startsWithAnyOfIgnoreCase: 'ms'
    };

    keys(operators).forEach(op => {
        let spec = operators[op];
        WhereClause.prototype[op] = spec.indexOf('m') >= 0 ? function () {
            let args = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
            if (args.some(a => spec.indexOf((typeof a)[0]) < 0)) {
                throw new TypeError (`Invalid type passed to WhereClause.${op}`);
            }
            let rv = new Expression(this.coll, op, [this.keyPath, args]);
            return this.op ? new Expression(this.coll, this.op, rv) : rv;
        } : function (val) {
            if (spec.indexOf((typeof val)[0]) < 0)
                throw new TypeError (`Invalid argument passed to WhereClause.${op}`);
            let rv = new Expression(this.coll, op, [this.keyPath, val]);
            return this.op ? new Expression(this.coll, this.op, rv) : rv;
        }
    });
 
    function Collection (down, op, data) {
        // First creation: new Collection(null, "uri", "friends");
        this.down = down;
        this.op = op;
        this.data = data;
    }

    Collection.prototype = {
        //
        // IEnumerable
        //
        each (onNext) {
            return new QueryExecutor()[this.op](this.down);
        },

        toArray(cb) {
            return new QueryExecutor().toArray(this).then(cb);
        },

        first(cb) {
            return this.limit(1).toArray(a => a[0]).then(cb);
        },

        last(cb) {
            return this.reverse().limit(1).toArray(a => a[0]).then(cb);
        },

        //
        // ICollection
        //
        eachKey(onNextKey) {
            return this.mapKeys().each(onNextKey);
        },

        eachPrimaryKey (onNext) {
            return this.mapPrimaryKeys().each(onNext);
        },

        eachUniqueKey (onNext) {
            return this.unique().mapKeys().each(onNext);
        },

        keys() {
            return this.mapKeys().toArray();
        },

        uniqueKeys() {
            return this.unique().mapKeys().toArray();
        },

        primaryKeys() {
            return this.mapPrimaryKeys().toArray();
        },

        where(keyPath) {
            return new WhereClause(this, keyPath, this.down ? 'and' : null);
        },

        //
        // IExpression
        //
        or (keyPath) {
            return new WhereClause(this, keyPath, 'or');
        },

        WhereClause = WhereClause
    }

    const collectionTransforms = {
        map: 'f',
        filter: 'f',
        reverse: '',
        limit: 'n',
        offset: 'n',
        orderBy: 'ms',
        until: '',
        distinct: '',
        unique: '',
        mapKeys: '',
        mapPrimaryKeys: ''
    };

    keys(collectionTransforms).forEach(transform => {
        let spec = collectionTransforms[transform];
        Collection.prototype[transform] = spec.indexOf('m') >= 0 ? function() {
            let args = getArrayOf.apply(NO_CHAR_ARRAY, arguments);
            if (args.some(a => spec.indexOf((typeof a)[0]) < 0)) {
                throw new TypeError (`Invalid type passed to Collection.${transform}`);
            }
            return new Collection(this, transform, args);
        } : function (val) {
            if (spec.indexOf((typeof val)[0]) < 0)
                throw new TypeError (`Invalid argument passed to WhereClause.${transform}`);
            return new Collection(this, transform, val);
        }
    });    

    return Collection;
}
