import {NO_CHAR_ARRAY, getArrayOf, keys, props} from './utils';
 
export function Collection (down, op, data) {
    // First creation: new Collection(new DexieQueryEngine({table: 'friends'}));
    this.op = op || "exec";
    this.data = data;
    this.down = op ? down : null;
    this._engine = op ? down._engine : down;
}

Collection.prototype = {
    //
    // IEnumerable
    //
    each (onNext) {
        return this.engine[this.op](this.down, onNext);
        //return new QueryExecutor()[this.op](this.down, onNext);
    },

    toArray(cb) {
        return this.engine.toArray(this).then(cb);
        //return new QueryExecutor().toArray(this).then(cb);
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
        return new this.WhereClause(this, keyPath, this.down ? 'and' : null);
    },

    //
    // IExpression
    //
    or (keyPath) {
        return new this.WhereClause(this, keyPath, 'or');
    }
}

// Three non-enumerable properties: _engine, WhereClause and Collection
props(Collection.prototype, {
    _engine: null,
    WhereClause: WhereClause,
    Collection: Collection
});

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
        return new this.Collection(this, transform, args);
    } : function (val) {
        if (spec.indexOf((typeof val)[0]) < 0)
            throw new TypeError (`Invalid argument passed to WhereClause.${transform}`);
        return new this.Collection(this, transform, val);
    }
});

/** This function creates a concrete Collection constructor. 
 * 
 */
export function WhereClause (collection, keyPath, op) {
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
        let rv = new this.Collection(this.coll, op, {keyPath: this.keyPath, value: args});
        return this.op ? new this.Collection(this.coll, this.op, rv) : rv;
    } : function (val) {
        if (spec.indexOf((typeof val)[0]) < 0)
            throw new TypeError (`Invalid argument passed to WhereClause.${op}`);
        let rv = new this.Collection(this.coll, op, {keyPath: this.keyPath, value: val});
        return this.op ? new this.Collection(this.coll, this.op, rv) : rv;
    }
});

props(WhereClause.prototype, {Collection: { get() { return this.coll.Collection; }}});

