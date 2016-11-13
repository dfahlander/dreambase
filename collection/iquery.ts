export interface IQuery {
    down: IQuery | null;
    op: string;
    data: any;
}

type KeyPathAndValue = {0: string, 1: any};

export interface IWhereQuery extends IQuery {
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
    data: KeyPathAndValue
}

export interface IExpressionQuery extends IQuery {
    down: IExpressionQuery | IWhereQuery
    op: 'or' | 'and';
    data: IExpressionQuery | IWhereQuery
}


// Enumerable Queries
export interface IExecuteQuery extends IQuery { op: 'enumerate'; }
export interface IToArrayQuery extends IQuery { op: 'toArray'; }
export interface IMapQuery extends IQuery { op: 'map'; data: Function }
export interface IFilterQuery extends IQuery { op: 'filter'; data: Function }
export interface ICountQuery extends IQuery { op: 'count' }
export interface IReverseQuery extends IQuery { op: 'reverse' }
export interface ILimitQuery extends IQuery { op: 'limit', data: number }
export interface IOffsetQuery extends IQuery { op: 'offset', data: number }
export interface IUntilQuery extends IQuery { op: 'offset', data: Function }
// Collection Queries
export interface IKeysQuery extends IQuery { op: 'keys' }
export interface IPrimaryKeysQuery extends IQuery { op: 'primaryKeys' }
export interface IUniqueQuery extends IQuery { op: 'unique' }
// Expression Queries
export interface IMultiArgsWhereQuery extends IWhereQuery {
    data: KeyPathAndValue
}


