export interface ICollection<T, TPrimaryKey> extends IEnumerable<T> {
    eachKey(onNextKey: (any)=>any): Promise<any>;
    eachPrimaryKey(onNextKey: (TPrimaryKey)=>any): Promise<any>;
    eachUniqueKey(onNextKey: (any)=>any): Promise<any>;
    keys(): Promise<any[]>;
    primaryKeys(): Promise<TPrimaryKey[]>;
    uniqueKeys(): Promise<any[]>;
    where (keyPath: string): IWhereClause<T, TPrimaryKey>;
    distinct(): IEnumerable<T>;
    unique(): ICollection<T, TPrimaryKey>;
    map<TMapped> (mapperFn: (T) => TMapped | Promise<TMapped>): ICollection<TMapped, TPrimaryKey>;
    mapKeys(): IEnumerable<any>;
    mapPrimaryKeys(): IEnumerable<TPrimaryKey>;
    // To implement:
    get(key:TPrimaryKey): Promise<T>; // If on root. Do db get. Else do this.where(':id').equals(key).first(); 1. do get. 2. Filter object. 3. Map object. 4. Return object.
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
    // To implement:
    reduce<X>(accumulator: (prev:X, curr:T)=>X, initial: X): Promise<X>;
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

export interface IWritableCollection<T, TPrimaryKey> extends ICollection<T, TPrimaryKey> {
    delete(): Promise<number>; // deprecate
    clear(): Promise<void>;
    modify(changeCallback: (obj: T, ctx:{value: T}) => void): Promise<number>;
    modify(changes: { [keyPath: string]: any } ): Promise<number>;
    // Table operations
    delete(key: TPrimaryKey): Promise<T>;
    put(obj:T, key?: TPrimaryKey): Promise<TPrimaryKey>;
    add(obj:T, key?: TPrimaryKey): Promise<TPrimaryKey>;
    update(key: TPrimaryKey, changes: { [keyPath: string]: any }): Promise<number>;
    bulkAdd(items: T[], keys?: TPrimaryKey[]): Promise<TPrimaryKey>;
    bulkPut(items: T[], keys?: TPrimaryKey[]): Promise<TPrimaryKey>;
    bulkDelete(keys: TPrimaryKey[]) : Promise<void>;
    bulkUpdate(keys: TPrimaryKey[], changeSets: { [keyPath: string]: any }[]) : Promise<void>;
    bulk(ops: {op:'add'|'put'|'update'|'delete', item:T, key?: TPrimaryKey}[]);
}

export interface IObservableCollection<T, TPrimaryKey> extends ICollection<T, TPrimaryKey> {
    observe(callback);
    unobserve(callback);
    observeReduction<X>(accumulator: (prev:X, curr:T)=>X, deaccumulator: (prev:X, curr:T)=>X, initial: X, cb:(x:X)=>any);
    unobserveReduction(cb);
}
