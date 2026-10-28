"""Template renderer for DeFi in Real Life journey workbooks.

A template is plain text with {expression|filter} tokens.  Expressions are a small, whitelisted
subset of Python (names, attribute access, numbers, + - * /, comparisons, and/or/not, if-else,
min/max/abs/round).  Every figure that reaches a player is computed from the locked engine's
decision-time state or its transaction log; the renderer never invents a number.

Filters:  (none)  money with cents dropped when whole      c  money always 2 decimals      r  money rounded to whole dollars
          p0/p1   percent (value already x100)             n  plain number          t  literal text
"""
import ast, re
from decimal import Decimal as D, ROUND_HALF_UP

TOKEN = re.compile(r'\{([^{}]+)\}')
_ALLOWED = (ast.Expression, ast.BinOp, ast.UnaryOp, ast.BoolOp, ast.Compare, ast.IfExp, ast.Call, ast.Name,
            ast.Attribute, ast.Constant, ast.Load, ast.Add, ast.Sub, ast.Mult, ast.Div, ast.USub, ast.UAdd, ast.Not, ast.And, ast.Or,
            ast.Gt, ast.GtE, ast.FloorDiv, ast.Lt, ast.LtE, ast.Eq, ast.NotEq, ast.In, ast.NotIn, ast.List, ast.Tuple, ast.Subscript, ast.Index if hasattr(ast, 'Index') else ast.Load)
def _m(x): return fmt_money(x)
def _lst(*a):
    a = [x for x in a if x]
    return ' and '.join(a) if len(a) < 3 else ', '.join(a[:-1]) + ' and ' + a[-1]
def _cond(c, a, b=''): return a if c else b
import math
def _ceil(x): return D(math.ceil(D(x)))
class _Q:  # noqa
    pass
_FUNCS = {'min': min, 'max': max, 'abs': abs, 'D': D, 'm': _m, 'lst': _lst, 'cond': _cond, 'ceil': _ceil, 'str': str, 'int': int}
CTX_FUNCS = ('eom', 'row')


class Ns(dict):
    """dict with attribute access; missing accounts read as 0."""
    def __getattr__(self, k):
        if k in self:
            return self[k]
        return D(0)


def _check(tree):
    for node in ast.walk(tree):
        if not isinstance(node, _ALLOWED):
            raise ValueError('disallowed expression element: %s' % type(node).__name__)
        if isinstance(node, ast.Attribute) and node.attr.startswith('_'):
            raise ValueError('private attribute')
        if isinstance(node, ast.Call) and not (isinstance(node.func, ast.Name) and (node.func.id in _FUNCS or node.func.id in CTX_FUNCS)):
            raise ValueError('only min/max/abs/D calls are allowed')


_cache = {}


def evaluate(expr, ctx):
    code = _cache.get(expr)
    if code is None:
        tree = ast.parse(expr.strip(), mode='eval')
        _check(tree)
        code = compile(tree, '<tpl>', 'eval')
        _cache[expr] = code
    env = dict(_FUNCS)
    env.update(ctx)
    return eval(code, {'__builtins__': {}}, env)


def fmt_money(x, cents=None):
    x = D(x).quantize(D('0.01'), ROUND_HALF_UP)
    neg = x < 0
    x = abs(x)
    whole = (x == x.to_integral_value())
    if cents is None:
        cents = not whole
    s = ('{:,.2f}' if cents else '{:,.0f}').format(x)
    return ('-$' if neg else '$') + s


def render(tpl, ctx):
    def sub(m):
        body = m.group(1)
        expr, _, flt = body.partition('|')
        v = evaluate(expr, ctx)
        flt = flt.strip()
        if flt == 't' or isinstance(v, str):
            return str(v)
        if flt == 'r':
            return fmt_money(D(v).quantize(D(1), ROUND_HALF_UP), False)
        if flt == 'f2':
            return '{:.2f}'.format(D(v).quantize(D('0.01'), ROUND_HALF_UP))
        if flt == 'c':
            return fmt_money(v, True)
        if flt.startswith('p'):
            n = int(flt[1:] or 0)
            return ('{:.%df}%%' % n).format(D(v).quantize(D(1).scaleb(-n), ROUND_HALF_UP))
        if flt == 'n':
            return str(D(v).normalize())
        if isinstance(v, bool):
            return 'yes' if v else 'no'
        return fmt_money(v)
    return TOKEN.sub(sub, tpl)


def norm(s):
    """normalise for comparison with locked-document text (markdown emphasis and spacing only)"""
    s = s.replace('**', '').replace('*', '').replace('~~', '')
    return re.sub(r'\s+', ' ', s).strip()
