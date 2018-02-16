import {ICursor, CursorSubscriber, KeyRange} from './common';

export interface ICursorProxyImpl {
    onNext?: CursorSubscriber;
    getKey?: ()=>any;
    getValue?: ()=>any;
    getPrimaryKey?: ()=>any;
    continue?: (key?)=>void;
    advance?: (count:number)=>void;
}

export default class ProxyCursor implements ICursor {
    readonly direction: string;
    readonly key;
    readonly value;
    readonly primaryKey;
    readonly continue: (key?)=>void;
    readonly advance: (count: number)=>void;

    readonly onNext: CursorSubscriber;
    readonly range: KeyRange;

    constructor (range: KeyRange, factory: (ICursor)=>ICursorProxyImpl | Promise<ICursorProxyImpl>);
}
