
/* This module should include the ICollection interface and its counterparts
   and also common types for all types of collections */

// The following interface is a common interface used by all collection types.
// It is also compatible with IDBCursor and IDBCursorWithValue.
export interface ICursor {
    readonly direction: string;
    readonly key: any;
    readonly primaryKey: any;
    readonly value?: any;
    continue(key?: any): void;
    advance(count: number): void;
}

export type CursorSubscriber = (ICursor)=>true | void;
export type Executor = (onNext: CursorSubscriber, query) => Promise<any>;

export interface KeyRange {
    readonly lower: any;
    readonly lowerOpen: boolean;
    readonly upper: any;
    readonly upperOpen: boolean;
}
