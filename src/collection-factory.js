import {Collection, Enumerable, WhereClause, Expression} from './newcollection';

interface IQueryExecutor {

}

export default function (createEngine) {

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

    class WhereClause<T,TPrimaryKey> implements WhereClause<T, TPrimaryKey> {
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
    
    new WhereClause(null, "ds", "oo")

    return {
        Collection: Collection,
        WhereClause: WhereClause,
        Expression: Expression,
    }
}
