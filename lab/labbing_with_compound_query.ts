import {ICursor, CursorSubscriber, Executor} from '../lab2/common';
import ProxyCursor from '../lab2/proxycursor';
import {ICollection} from '../collection/icollection';
import {getByKeyPath} from '../collection/utils';

export interface Expression {
    left: string | string[] | Expression;
    op: string; // 'and','or' but also 'equals',... and 'equalsIgnoreCase'... etc.
    right: IDBValidKey | Expression;
    options?;
}

interface Query {
    expr: Expression;
}

class IDBCollection {
    _query: Query;

    constructor (query: Query) {
        this._query = query;
    }

    _exec(onNext: CursorSubscriber, query: Query) {
        // 1. Reduce _query.expr to array of <array of compound IDB-expressions>
        //    Logical OR between each top-level array item.
        //    Logical AND between each inner array item.
        // 2. Search for compound indexes to use. If missing, complain.
        // 3. 
    }
}