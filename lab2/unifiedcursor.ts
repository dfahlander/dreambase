import {Expression} from './idbquery';
import ProxyCursor from './proxycursor';
/*
    UnifiedCursor is a ProxyCursor that can iterate through an expression of same keys,
    such as (age >= 7 AND age < 18) OR (age >= 65).
        canonicalize() will make sure such an expression will be of type "unify" and its value
        will be an array of array of expressions, where outer array is OR and inner array is AND.
*/

class UnifiedCursor extends ProxyCursor {
    constructor (keyPath: string, unifiedExpr: Expression[][]) {
        const range = rangeFromExpr(unifiedExpr);
        super(range, cursor => {
            
        })
    }
}