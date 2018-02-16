import {ICursor, CursorSubscriber, KeyRange} from './common';
import ProxyCursor from './proxycursor';
import {fill} from './utils';

declare var cmp;
var MaxKey = [[]];

export class CompoundCursor extends ProxyCursor {
    constructor (range: KeyRange, numIncludedKeys: number, totalKeys: number, onNext) {
        super(range, function (cursor: ICursor) {
            const reverse = cursor.direction.indexOf('prev') === 0;
            const unique = cursor.direction.indexOf('unique') > 0;
            const prefilled = new Array(totalKeys);

            return {
                getKey () {
                    return numIncludedKeys === 1 ?
                        cursor.key[0] :
                        cursor.key.slice(0, numIncludedKeys);
                },

                onNext (cursor: ICursor) {
                    let currentKey = cursor.key;
                    for (let i=0; i<numIncludedKeys; ++i) {
                        const diff = cmp(currentKey[i], parentKeys[i]);
                        if (diff === 0) continue; // Check next or finally forward onNext()
                        if (reverse ? (diff < 0) : (diff > 0)) return true;
                        cursor.continue(); // Not yet reached the key. Continue to it.
                        return;
                    }
                    return onNext(this);
                },

                continue(key?) {
                    if (key !== undefined) {
                        // Translate from simple key to compound key. Direction may affect.
                        prefilled[offset] = key;
                        fill(prefilled, reverse ? MaxKey : -Infinity, offset + 1, totalKeys);
                        return cursor.continue(prefilled);
                    }
                    // key is undefined:
                    if (unique) {
                        if (numTrails === 0) {
                            // No trailing keys. Just continue as normal.
                            return cursor.continue();
                        } else {
                            prefilled[offset] = cursor.key[offset];
                            fill (prefilled, reverse ? -Infinity : MaxKey, offset + 1, totalKeys);
                            return cursor.continue(prefilled);
                        }
                    }
                    // Normal case:
                    // If only have parentKeys, just continue.
                    // If only have trailing keys, also just continue.
                    // If have both parent and trailing keys, also just continue.
                    cursor.continue();                    
                }
            };
        });
    }
}
