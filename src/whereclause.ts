import Expression from './expression';
import Collection from './collection';

interface WhereClause<T, TPrimaryKey> {
    above(lowerBound) : Expression<T, TPrimaryKey>;
    aboveOrEqual(lowerBound) : Expression<T, TPrimaryKey>;
    anyOf(keys: any[]): Expression<T, TPrimaryKey>;
    anyOf(...keys: any[]): Expression<T, TPrimaryKey>;
    anyOfIgnoreCase(keys: string[]): Expression<T, TPrimaryKey>;
    anyOfIgnoreCase(...keys: string[]): Expression<T, TPrimaryKey>;
    below(key: any): Expression<T, TPrimaryKey>;
    belowOrEqual(key: any): Expression<T, TPrimaryKey>;
    between(lower: any, upper: any, includeLower?: boolean, includeUpper?: boolean): Expression<T, TPrimaryKey>;
    equals(key: any): Expression<T, TPrimaryKey>;
    equalsIgnoreCase(key: string): Expression<T, TPrimaryKey>;
    inAnyRange(ranges: Array<any[]>): Expression<T, TPrimaryKey>;
    startsWith(key: string): Expression<T, TPrimaryKey>;
    startsWithAnyOf(prefixes: string[]): Expression<T, TPrimaryKey>;
    startsWithAnyOf(...prefixes: string[]): Expression<T, TPrimaryKey>;
    startsWithIgnoreCase(key: string): Expression<T, TPrimaryKey>;
    startsWithAnyOfIgnoreCase(prefixes: string[]): Expression<T, TPrimaryKey>;
    startsWithAnyOfIgnoreCase(...prefixes: string[]): Expression<T, TPrimaryKey>;
    noneOf(keys: Array<any>): Expression<T, TPrimaryKey>;
    notEqual(key: any): Expression<T, TPrimaryKey>;
}

const operators = [
    'above',
    'aboveOrEqual',
    'anyOf',
    'anyOfIgnoreCase',
    'below',
    'belowOrEqual',
    'between',
    'equals',
    'equalsIgnoreCase',
    'inAnyRange',
    'noneOf',
    'notEqual',
    'startsWith',
    'startsWithAnyOf',
    'startsWithIgnoreCase',
    'startsWithAnyOfIgnoreCase'
];

class WhereClause<T,TPrimaryKey> {
    coll: Collection<T,TPrimaryKey>;
    index: string;
    op: string;

    constructor (collection : Collection<T,TPrimaryKey>, indexName : string, op : string) {
        this.coll = collection;
        this.index = indexName;
        this.op = op;
    }
}

// Macro to create one method per operator:
operators.forEach(op => {
    WhereClause.prototype[op] = function () {
        // Clone arguments. Avoid https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments
        let args = new Array(arguments.length);
        let i = arguments.length;
        while (i--) args[i] = arguments[i];
        let rv = new Expression(this.coll, this.index, op, args);
        return this.op ? new Expression((this as WhereClause).coll, this.op, rv) : rv;
    }
});

export default WhereClause;
