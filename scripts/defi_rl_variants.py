"""Visible-state variant selection.  Each function reads ONLY the decision-time snapshot (st = s.decs[k]).
Locked variant modules (pinned in engine/variants/) are used where the project already validated them;
Zoe and Maya variants are written here from their locked journey documents (no new financial behavior)."""
import os, sys
from decimal import Decimal as D
HERE = os.path.dirname(os.path.abspath(__file__))
VDIR = os.path.join(os.path.dirname(HERE), 'curriculum', 'defi-real-life', 'approved', 'workbooks', 'engine', 'variants')
sys.path.insert(0, VDIR)
import elena_variants as EV, marcus_variants as MV, jules_variants as JV


def elena(k, st):
    if k == 1: return 'afford' if EV.v2(st)['A_ok'] else 'tight'
    if k == 2: return 'c_ok' if EV.v3(st)['C_ok'] else 'c_not_ok'
    if k == 3: return 'eth' if st['ETH'] > 0 else 'none'
    if k == 5: return EV.v6(st)['cls']
    if k == 6: return 'card_owed' if EV.v7(st)['B_executes'] else 'cash_short'
    return 'all'

def marcus(k, st):
    if k == 3: return 'short' if MV.v4(st)['gap'] > 0 else 'covered'
    if k == 4: return 'held' if MV.v5(st)['risk'] > 0 else 'empty'
    if k == 5:
        u = st['USDC']
        return 'held_all' if u == 2500 else ('held_half' if u == 1250 else 'none')
    if k == 6: return MV.v7(st)['cls']
    return 'all'

def _allow(st, X, L=None):
    L = st['CHK'] + st['SAV'] if L is None else L
    return (st['cumETH'] + X <= 200 and L - X >= 3300) or (L - X >= 4700)

def maya(k, st):
    L = st['CHK'] + st['SAV']
    if k == 2: return 'in_plan' if _allow(st, 150) else 'out_of_plan'
    if k == 3: return 'eth' if st['ETH'] > 0 else 'none'
    if k == 4: return 'vault' if st['VAULT'] > 0 else 'no_vault'
    if k == 5:
        if L - 200 < 3300: return 'blocked'
        return 'within_plan' if _allow(st, 200) else 'over_allowance'
    return 'all'

def zoe(k, st):
    if k == 1: return 'eth' if st['ETH'] > 0 else 'no_eth'
    if k == 5:
        L = st['CHK'] + st['SAV'] + st['TUI']
        a = 'a1' if L >= 1500 else ('a2' if L >= 700 else 'a3')
        b = 'b1' if L >= 750 else 'b2'
        sell = st['VAULT'] + st['ETH']
        c = 'c3' if sell == 0 else ('c2' if L >= 1500 else 'c1')
        return '%s_%s_%s' % (a, b, c)
    return 'all'

def jules(k, st):
    if k == 1: return 'fit' if JV.v2(st)['C_eth'] else 'over'
    if k == 2:
        v = JV.v3(st)
        return ('bo' if v['B_exec'] else 'bb') + '_' + ('co' if v['C_exec'] else 'cb')
    if k == 3:
        v = JV.v4(st)
        return 'loan' if v['mode'] == 'loan' else ('free_eth' if v['B_exec'] else 'free_noeth')
    if k == 4: return 'pool' if JV.v5(st)['has_pool'] else 'no_pool'
    if k == 5: return 'vault' if JV.v6(st)['has_vault'] else 'no_vault'
    if k == 6:
        v = JV.v7(st)
        return 'sale' if v['over8'] else ('within_exec' if v['C_exec'] else 'within_blocked')
    return 'all'

def dana(k, st):
    """Dana: variants come from the visible tests T1-T5 (D5), the loan state (D4) and the D7 gap -- never from an answer."""
    if k == 3: return 'loan' if st['KLOAN'] > 0 else 'noloan'
    if k == 4:
        t2, t3, t4, t5 = st['d5_cond']
        if t2: return 'l_manage' if (t4 and not t5) else 'l_not'
        return 'nl_on' if t3 else 'nl_behind'
    if k == 6: return 'gap' if st['gap'] > 0 else 'nogap'
    return 'main'

VARIANT = {'elena': elena, 'marcus': marcus, 'maya': maya, 'zoe': zoe, 'jules': jules, 'dana': dana}
