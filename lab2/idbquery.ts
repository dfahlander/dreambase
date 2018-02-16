    
export interface PlainExpression {
    keyPath: string | string[];
    op: string;
    value;
    options?;
}

/*export interface UnifiedExpression {
    keyPath: string | string[];
    op: 'intersect' | 'union';
    expressions: PlainExpression[]
}*/

export interface CombinedExpression {
    left: Expression;
    op: 'or' | 'and';
    right: Expression; 
}

/*
export interface UnifiedExpression extends PlainExpression {
    keyPath: string | string[];
    op: 'unify';
    value: CanonicalExpression;
}*/


export type Expression = PlainExpression | CombinedExpression;
export type CanonicalExpression = PlainExpression[][];


export interface IDBQuery {
    mode?: 'readonly' | 'readwrite';
    writeLocked?: boolean | string;
    tableName: string;
    expr?: Expression;
    dir?: 'next' | 'prev';
    unique?: '' | 'unique';
    keysOnly?: boolean;
}
