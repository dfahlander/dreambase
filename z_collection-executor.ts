import {Enumerable, Collection, Expression, WhereClause} from './collection';

export interface Query {
    parent: Query | null;
    op: string;
}

export interface WhereQuery extends Query {
    keyPath: string;
    op: 'above' |
        'aboveOrEqual' |
        'anyOf' |
        'below' |
        'between' |
        'equals' |
        'inAnyRange' |
        'startsWith' |
        'startsWithAnyOf' |
        'noneOf' |
        'notEqual' |
        // case ignoring expressions:
        'anyOfIgnoreCase' |
        'equalsIgnoreCase' |
        'startsWithIgnoreCase' |
        'startsWithAnyOfIgnoreCase';
    value: any;
}

export interface ExpressionQuery extends Query {
    left: ExpressionQuery | WhereQuery
    op: 'or' | 'and';
    right: ExpressionQuery | WhereQuery
}


// Enumerable Queries
export interface EnumerateQuery extends Query { op: 'enumerate'; }
export interface ArrayQuery extends Query { op: 'array'; }
export interface MapQuery extends Query { op: 'map'; data: Function }
export interface FilterQuery extends Query { op: 'filter'; data: Function }
export interface CountQuery extends Query { op: 'count' }
export interface ReverseQuery extends Query { op: 'reverse' }
export interface LimitQuery extends Query { op: 'limit', data: number }
export interface OffsetQuery extends Query { op: 'offset', data: number }
export interface UntilQuery extends Query { op: 'offset', data: Function }
// Collection Queries
export interface KeysQuery extends Query { op: 'keys' }
export interface PrimaryKeysQuery extends Query { op: 'primaryKeys' }
export interface UniqueQuery extends Query { op: 'unique' }
// Expression Queries
export interface MultiArgsWhereQuery extends WhereQuery {
    keyPath: string,
    value: any[]
}

export interface CancelToken {
    cancelled: boolean;
    cancel();
}

export enum ExecutionFlags {
    GiveValues = 1,
    GiveKeys = 2,
    GivePrimaryKeys = 4,
    Unique = 8,
    Reverse = 16,
    MustEnumerate = 32
}

export type QueryExecutor = (query: Query, onNext: Function) => Promise<any>;

export interface CollectionExecutor {
    // Root operation:
    enumerate(onNext, flags: ExecutionFlags, ct: CancelToken, coll: ExecutableEnumerable, name: string) : Promise<any>;

    // Collection
    //unique (onNext, coll, flags);
    //keys (onNext, coll, flags);
    //primaryKeys (onNext, coll, flags);

    // Enumerable
    arrayOf(e : ExecutableEnumerable) : Promise<any[]>;

    // Expression
    and (onNext, flags, ct, lexpr: ExecutableExpression, rexpr: ExecutableExpression) : Promise<any>;

    // TODO: Uppdatera signaturer nedan från ovan.

    // WhereClause:
    equals (onNext, coll, index, value);
    
    orderBy (onNext, coll, index);
    map (onNext, coll, mapperFn);

    // Required by

}

