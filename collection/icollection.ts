
export interface ICollection<T, TPrimaryKey> extends IEnumerable<T> {
    eachKey(onNextKey: (any)=>any) : Promise<any>;
    eachPrimaryKey(onNextKey: (TPrimaryKey)=>any) : Promise<any>;
    eachUniqueKey(onNextKey: (any)=>any) : Promise<any>;
    keys() : Promise<any[]>;
    primaryKeys() : Promise<TPrimaryKey[]>;
    uniqueKeys() : Promise<any[]>;
    where (keyPath : string) : IWhereClause<T, TPrimaryKey>;
    distinct() : ICollection<T, TPrimaryKey>;
    unique() : ICollection<T, TPrimaryKey>;
    mapKeys() : IEnumerable<any>;
    mapPrimaryKeys(): IEnumerable<TPrimaryKey>;
}

export interface IEnumerable<T> {
    each (onNext: (T)=>any) : Promise<any>;
    toArray (cb?: (result: T[]) => any) : Promise<T[]>;
    map<TMapped> (mapperFn: (T) => TMapped | Promise<TMapped>) : IEnumerable<TMapped>;
    filter(filterFn: (T) => boolean | Promise<boolean>) : IEnumerable<T>;
    count(cb?: (countResult: number) => any) : Promise<number>;
    reverse() : IEnumerable<T>;
    first() : Promise<T>;
    last() : Promise<T>;
    limit(limit: number) : IEnumerable<T>;
    offset(offset : number) : IEnumerable<T>;
    orderBy(...keyPaths: string[]) : IEnumerable<T>;
    orderBy(keyPaths: string[]) : IEnumerable<T>;
    until() : IEnumerable<T>;
}

export interface IExpression<T, TPrimaryKey> extends ICollection<T, TPrimaryKey> {
    or (keyPath : string) : IWhereClause<T, TPrimaryKey>;
}

export interface IWhereClause<T, TPrimaryKey> {
    above(lowerBound) : IExpression<T, TPrimaryKey>;
    aboveOrEqual(lowerBound) : IExpression<T, TPrimaryKey>;
    anyOf(keys: any[]): IExpression<T, TPrimaryKey>;
    anyOf(...keys: any[]): IExpression<T, TPrimaryKey>;
    anyOfIgnoreCase(keys: string[]): IExpression<T, TPrimaryKey>;
    anyOfIgnoreCase(...keys: string[]): IExpression<T, TPrimaryKey>;
    below(key: any): IExpression<T, TPrimaryKey>;
    belowOrEqual(key: any): IExpression<T, TPrimaryKey>;
    between(lower: any, upper: any, includeLower?: boolean, includeUpper?: boolean): IExpression<T, TPrimaryKey>;
    equals(key: any): IExpression<T, TPrimaryKey>;
    equalsIgnoreCase(key: string): IExpression<T, TPrimaryKey>;
    inAnyRange(ranges: Array<any[]>): IExpression<T, TPrimaryKey>;
    startsWith(key: string): IExpression<T, TPrimaryKey>;
    startsWithAnyOf(prefixes: string[]): IExpression<T, TPrimaryKey>;
    startsWithAnyOf(...prefixes: string[]): IExpression<T, TPrimaryKey>;
    startsWithIgnoreCase(key: string): IExpression<T, TPrimaryKey>;
    startsWithAnyOfIgnoreCase(prefixes: string[]): IExpression<T, TPrimaryKey>;
    startsWithAnyOfIgnoreCase(...prefixes: string[]): IExpression<T, TPrimaryKey>;
    noneOf(keys: Array<any>): IExpression<T, TPrimaryKey>;
    notEqual(key: any): IExpression<T, TPrimaryKey>;
}

