
export interface Collection<T, TPrimaryKey> extends Enumerable<T> {
    distinct() : Collection<T, TPrimaryKey>;
    eachKey(onNextKey: (any)=>any) : Promise<any>;
    eachPrimaryKey(onNextKey: (TPrimaryKey)=>any) : Promise<any>;
    eachUniqueKey(onNextKey: (any)=>any) : Promise<any>;
    keys() : Promise<any[]>;
    primaryKeys() : Promise<TPrimaryKey[]>;
    uniqueKeys() : Promise<any[]>;
    where (key : string) : WhereClause<T, TPrimaryKey>;
}

export interface Enumerable<T> {
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

export interface WhereClause<T, TPrimaryKey> {
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

export interface Expression<T, TPrimaryKey> extends Collection<T, TPrimaryKey> {
    or (key : string) : WhereClause<T, TPrimaryKey>;
}

