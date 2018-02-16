import {PlainExpression, CombinedExpression, CanonicalExpression, Expression, UnifiedExpression, IDBQuery} from './idbquery';

// TODO: Remove unify!
export function matrixify(expr: PlainExpression | CombinedExpression, unify: boolean) : CanonicalExpression {
    if ('keyPath' in expr) return [[expr as PlainExpression]];
    if (unify) {
        let key = singleKey(expr);
        if (key) return [[{
            op: 'unify',
            keyPath: key,
            value: matrixify(expr, false)}]];
    }

    // a AND b ==> [[b,a]]
    // a AND (b AND c) ==> [[c,b,a]]
    // (a AND b) AND c ==> [[c,b,a]]
    // a OR b ==> [[a], [b]]
    // a AND (b OR c) ==> [[b,a], [c,a]]
    // a AND (b AND (c OR d)) ==> [[a,b,c] , [a,b,d]]
    // a AND (b OR (c AND d)) ==> [[a,b] , [a,c,d]]
    
    expr = expr as CombinedExpression;
    let left = expr.left,
        right = expr.right;

    if (expr.op === 'and') {
        // return canonicalize(left, ands.concat(canonicalize(right, ands))) :
        const leftResult = matrixify(left, unify);
        const rightResult = matrixify(right, unify);

        // [[a]], [[b]] ==> [[a,b]]
        // [[a,b]], [[c,d]] ==> [[a,b,c,d]]
        // [[a], [b]], [[c]] ==> [[a,c], [b,c]]
        // [[a], [b]], [[c], [d]] ==> [[a,c], [a,d], [b,c], [b,d]]
        const result: CanonicalExpression = [];
        leftResult.forEach(lAnds => {
            rightResult.forEach(rAnds => {
                result.push(lAnds.concat(rAnds));
            });
        });
        return result;
    }

    // OR:
    return matrixify(left, unify).concat(matrixify(right, unify));
}

export function singleKey(expr: Expression) {
    if ('keyPath' in expr) return (expr as PlainExpression).keyPath;
    // 'or' or 'and'
    const left = singleKey((expr as CombinedExpression).left),
          right = singleKey((expr as CombinedExpression).right);
    return left === right ? left : null;
}

export function isExpressionIdentical(expr1: PlainExpression, expr2: PlainExpression) {
    return expr1.keyPath === expr2.keyPath &&
        expr1.op === expr2.op &&
        (expr1.op === 'intersect' || expr1.op === 'union' ?
            isUnifiedExpressionIdentical(expr1.value as PlainExpression[], expr2.value as PlainExpression[]) : 
            expr1.value+'' === expr2.value+'');
}

export function isUnifiedExpressionIdentical (exprSet1: PlainExpression[], exprSet2: PlainExpression[]) {
    const l1 = exprSet1.length,
          l2 = exprSet2.length;
    if (l1 != l2) return false;
    for (let i=0; i<l1; ++i) {
        let found = false;
        for (let j=0; j<l2; ++j) {
            if (exprSet1[i].op === exprSet2[j].op &&
                exprSet1[i].value+'' === exprSet2[j].value+'')
                found = true;
        }
        if (!found) return false;
    }
    return true;
}

export function unifyAnds (ands: PlainExpression[]) {
    const result : PlainExpression[] = [];
    for (let i=0, l=ands.length; i<l-1; ++i) {
        const expr1 = ands[i],
              withEqualKeys: PlainExpression[] = [];
        let hasDuplicate = false;
              
        for (let j=i+1; j<l; ++j) {
            const expr2 = ands[j];
            if (expr1.keyPath !== expr2.keyPath) continue;
            if (expr1.op === expr2.op &&
                expr1.value !== undefined && // Not needed if we really know type is PlainExpression
                expr1.value+'' === expr2.value+'')
            {
                // Identical Expression
                hasDuplicate = true;
                break;
            } else {
                // Can be unified
                withEqualKeys.push(expr2);
            }
        }

        if (hasDuplicate) continue;
        if (withEqualKeys.length > 0) {
            result.push({
                keyPath: expr1.keyPath,
                op: 'intersect',
                expressions: withEqualKeys.concat(expr1)});
        } else {
            result.push(expr1);
        }
    }
}
