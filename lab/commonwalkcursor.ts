import {ICursor, CursorSubscriber} from '../lab2/common';
import ProxyCursor from '../lab2/proxycursor';
import {ICollection} from '../collection/icollection';
import {getByKeyPath} from '../collection/utils';

const MAX_PARALLELL_REQUESTS = 25; // Need to test out this...

export class CommonWalkCursor extends ProxyCursor {
    constructor (collections: ICollection<any,any>[], keyPath: string | string[]) {
        super(cursor => {
            let pos = 0;
            

            /*{
                onNext (cursor: ICursor) {
                    cursor.
                }
            };*/
        });
    }
} 