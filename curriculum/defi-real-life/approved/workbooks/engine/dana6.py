#!/usr/bin/env python3
"""
FinLit Quest - Dana Okafor, DeFi in Real Life - v0.6 FINAL-CANDIDATE ledger engine and validator.

Standard library only (Python 3.8+).  All money is decimal, rounded half-up to cents.
This file is a CURRICULUM VALIDATION TOOL.  It is not game code and is not approved.

Usage
  python3 dana6.py --verify                  # all 2,187 answer combinations x 2 allocation modes
  python3 dana6.py --path BCACBAC            # print monthly cash-flow schedule for one answer path
  python3 dana6.py --path BCACBAC --alloc    # same, with the unscored Other-cash allocation used
  python3 dana6.py --export OUTDIR           # write schedule + transaction-log CSVs for 3 example paths
Every balance change goes through Sim.tx(), which writes one row per account to a transaction log.
audit_ledger.py re-verifies that log WITHOUT importing this file.
"""
import argparse, copy, csv, hashlib, itertools, os, sys
from decimal import Decimal as D, ROUND_HALF_UP, getcontext
getcontext().prec = 40

def r(x):                      # cents, half-up
    return D(x).quantize(D('0.01'), ROUND_HALF_UP)

ASSETS = ['CHK', 'RES', 'HOME', 'OTHER', 'VAULT', 'APEX', 'POOL', 'ETH']
LIABS  = ['STU', 'KLP', 'KLI']
IDX = {1: D(100), 9: D(60), 11: D(42), 19: D(55), 23: D(48)}   # ETH value index (story events)
# NEED_REV = total purchase cash needed = cash to close ($30,000 down + $13,100 closing costs = $43,100)
#            + Dana's own moving/move-in budget ($4,400).  Moving costs are NOT part of a lender's 'cash to close'.
# DOCFEE = $450 records-reconstruction cost Dana pays if her DeFi paper trail is late/missing (FICTIONAL, illustrative;
#          it is Dana's own cost, not a lender fee).  EXTFEE = illustrative rate-lock extension fee per delay month.
NEED_ORIG, NEED_REV, DOCFEE, EXTFEE = D(45000), D(47500), D(450), D(450)
EXPECTED_SHA = '29054a01363f117ee6cfeb51adc45f80f0f3b6bd2534573eb3021337841b81b7'  # SHA-256 of the 4,374 lines joined by \\n (no trailing newline)
ESSENTIALS_ONE_MONTH = D(2900)

class Sim:
    def __init__(s, ch, alloc=False, logging=True):
        s.ch, s.alloc = ch, alloc
        s.b = dict(CHK=D(1800), RES=D(8700), HOME=D(21000), OTHER=D(0), VAULT=D(0), APEX=D(0),
                   POOL=D(0), STU=D(12000), KLP=D(0), KLI=D(0))
        s.u = D(2400)                      # ETH units: value = units * idx / 100
        s.idx = D(100)
        s.log = [] if logging else None
        s.seq = 0
        s.ext = {}                         # net-worth effect by tag
        s.cost = dict(fees=D(0), interest=D(0), losses=D(0))
        s.drv = dict(transfers=D(0), principal=D(0), rebuild=D(0), redirect=D(0))
        s.rebuild_from = None
        s.docfee = D(0); s.late = False; s.delay = 0; s.b_blocked = False; s.b_warn = False; s.rcover = D(0)
        s.sched = []                       # schedule snapshots
        s.snaps = {}
        s.full = {}                        # full-credit sets, filled at each decision
        s.nw0 = s.nw()

    # ---------- primitives ----------
    def E(s): return r(s.u * s.idx / 100)
    def K(s): return s.b['KLP'] + s.b['KLI']
    def nw(s):
        return s.E() + sum(s.b[a] for a in ASSETS if a != 'ETH') - sum(s.b[a] for a in LIABS)

    def tx(s, month, event, deltas, tag, units=D(0), new_idx=None):
        """The ONLY place balances change.  deltas: {account: signed change}. ETH deltas are derived."""
        e0 = s.E(); s.u += units
        if new_idx is not None: s.idx = new_idx
        assert s.u >= 0, ('negative ETH units', event, s.ch)
        d = {k: D(v) for k, v in deltas.items()}
        e1 = s.E()
        if e1 != e0: d['ETH'] = d.get('ETH', D(0)) + (e1 - e0)
        eff = D(0)
        for a, v in d.items():
            if a == 'ETH': eff += v
            elif a in LIABS: s.b[a] += v; eff -= v; assert s.b[a] >= 0, ('negative liability', a, event, s.ch)
            else: s.b[a] += v; eff += v; assert s.b[a] >= 0, ('negative asset', a, s.b[a], event, s.ch)
        s.ext[tag] = s.ext.get(tag, D(0)) + eff
        if s.log is not None:
            s.seq += 1
            for a, v in d.items():
                bal = s.E() if a == 'ETH' else s.b[a]
                s.log.append((s.seq, month, event, tag, a, v, bal, s.idx, s.u))
        return eff

    def snap(s, month, label):
        b = s.b
        sn = dict(month=month, label=label, CHK=b['CHK'], RES=b['RES'], HOME=b['HOME'], OTHER=b['OTHER'],
                  VAULT=b['VAULT'], APEX=b['APEX'], POOL=b['POOL'], ETH=s.E(),
                  PLEDGED=s.E() if b['KLP'] > 0 else D(0), STU=b['STU'], KLOAN=s.K(),
                  FEES=s.cost['fees'], INT=s.cost['interest'], LOSS=s.cost['losses'],
                  PURCHASE=b['HOME'], NW=s.nw(), IDX=s.idx)
        s.sched.append(sn); return sn

    # ---------- ETH helpers ----------
    def reprice(s, m, new, ev):
        s.tx(m, ev, {}, 'eth_price', new_idx=new)

    def sell(s, m, S, ev):
        """Sell S dollars of ETH at the current index; 0.5% swap fee; net proceeds -> OTHER."""
        S = r(S); assert S <= s.E() + D('0.005'), ('sell more than held', S, s.E(), s.ch)
        fee = r(S * D('0.005')); units = min(S * 100 / s.idx, s.u)
        s.cost['losses'] += r(units - S); s.cost['fees'] += fee
        s.tx(m, ev, {'OTHER': S - fee}, 'swap_fee', units=-units)
        return S - fee

    def repay_with_collateral(s, m, ev):
        """Atomic: sell just enough pledged ETH to clear interest then principal; release the rest."""
        owed = s.K(); S = r(owed / D('0.995')); fee = S - owed
        assert S <= s.E() + D('0.005'), ('collateral short', S, s.E(), s.ch)
        units = min(S * 100 / s.idx, s.u)
        s.cost['losses'] += r(units - S); s.cost['fees'] += fee
        s.tx(m, ev, {'KLP': -s.b['KLP'], 'KLI': -s.b['KLI']}, 'swap_fee', units=-units)
        return S, fee

    def pay_loan_cash(s, m, src, amt, ev):
        amt = D(amt); assert amt <= s.K() and amt <= s.b[src], ('bad loan repayment', amt, s.K(), s.ch)
        i = min(s.b['KLI'], amt)
        s.tx(m, ev, {src: -amt, 'KLI': -i, 'KLP': -(amt - i)}, 'transfer')

    # ---------- month-end cycle ----------
    def cycle(s, m, redirect=D(0), fee=D(0)):
        """income 4,600; essentials 2,900 (incl. 250 loan payment); flexible 700; 1,000 to home savings.
        redirect: extra discretionary dollars moved to home savings (D7 C).  fee: extension fee paid by
        cutting the same amount from discretionary spending (delay months)."""
        ev = 'month-end %d' % m
        s.tx(m, ev, {'CHK': D(4600)}, 'income')
        reb = D(0)
        if s.rebuild_from is not None and m >= s.rebuild_from and s.b['RES'] < 8700:
            reb = min(D(200), D(8700) - s.b['RES'])
        s.tx(m, ev, {'CHK': -(D(3350) - reb - redirect - fee)}, 'living')
        i = r(s.b['STU'] * D('0.005'))
        s.tx(m, ev, {'STU': i}, 'student_interest')
        s.tx(m, ev, {'CHK': D(-250), 'STU': D(-250)}, 'transfer')
        if reb: s.tx(m, ev, {'CHK': -reb, 'RES': reb}, 'transfer')
        s.tx(m, ev, {'CHK': -(D(1000) + redirect), 'HOME': D(1000) + redirect}, 'transfer')
        if fee:
            s.tx(m, ev, {'CHK': -fee}, 'extension_fee'); s.cost['fees'] += fee
        s.drv['transfers'] += 1000; s.drv['principal'] += 250 - i
        s.drv['rebuild'] += reb; s.drv['redirect'] += redirect
        if s.b['VAULT'] > 0:
            vr = D('0.08') if m <= 6 else D('0.05') if m <= 12 else D('0.035')
            s.tx(m, ev, {'VAULT': r(s.b['VAULT'] * vr / 12)}, 'vault_interest')
        if s.b['KLP'] > 0:
            ac = r(s.b['KLP'] * D('0.0075')); s.cost['interest'] += ac
            s.tx(m, ev, {'KLI': ac}, 'loan_interest')
        assert s.b['CHK'] == 1800 or s.bonus_pending, ('checking not constant', s.b['CHK'], m, s.ch)

    bonus_pending = False

    # ---------- decisions ----------
    def D1(s):
        x = s.ch[0]; s.full['D1'] = {'B'}
        if x in 'AC':
            amt = D(21000) if x == 'A' else D(6000)
            s.tx(1, 'D1 ' + x, {'HOME': -amt, 'VAULT': amt}, 'transfer')

    def D2(s):
        s.full['D2'] = {'C'}
        if s.ch[1] == 'B':
            s.cost['losses'] += 400
            s.tx(4, 'D2 B', {}, 'theft', units=D(-400) * 100 / s.idx)

    def D3(s):
        x = s.ch[2]; m = 6
        s.full['D3'] = {'A'}                           # v0.5: unconditional for Dana (conditional principle kept for other characters)
        s.tx(m, 'D3 repair bill', {'CHK': D(-900)}, 'repair')
        if x == 'A': s.tx(m, 'D3 A', {'RES': D(-900), 'CHK': D(900)}, 'transfer'); s.rebuild_from = 7
        elif x == 'B':
            assert D(900) <= s.E() * D('0.5')
            s.tx(m, 'D3 B', {'KLP': D(900), 'CHK': D(900)}, 'transfer')
        else: s.tx(m, 'D3 C', {'HOME': D(-900), 'CHK': D(900)}, 'transfer')

    def D4(s):
        x = s.ch[3]; m = 9
        if s.b['KLP'] > 0:
            s.d4var = 'L'; s.full['D4'] = {'B'}
            assert s.K() / s.E() < D('0.8')
            if x == 'B': s.repay_with_collateral(m, 'D4 B repay with collateral')
            elif x == 'C':
                assert s.b['RES'] >= 500
                s.pay_loan_cash(m, 'RES', 500, 'D4 C repay 500 from reserve'); s.rebuild_from = 10
        else:
            s.d4var = 'N'; s.full['D4'] = {'B', 'C'}
            if x == 'A':
                s.tx(m, 'D4 A buy ETH', {'HOME': D(-500)}, 'transfer', units=D(500) * 100 / s.idx)
            elif x == 'B':
                s.sell(m, s.E(), 'D4 B sell all ETH')

    def liq11(s):
        m = 11
        if s.b['KLP'] > 0:
            owed = s.K(); thr = (owed / D('0.8')) * 100 / s.u
            if IDX[11] < thr <= s.idx:
                s.reprice(m, thr, 'ETH reaches liquidation index')
                seized = r(owed * D('1.05')); units = min(seized * 100 / s.idx, s.u)
                s.cost['losses'] += r(units - seized); s.cost['fees'] += seized - owed
                s.tx(m, 'LIQUIDATION', {'KLP': -s.b['KLP'], 'KLI': -s.b['KLI']}, 'liq_penalty', units=-units)
                s.liq = (owed, seized, seized - owed, thr)
        s.reprice(m, IDX[11], 'ETH index 42')

    def D5(s):                                   # end of month 12, after the month-12 cycle
        x = s.ch[4]; m = 12
        t2 = s.b['KLP'] > 0                       # a Keystone loan (9%, costs more than the 6% student loan) is open
        t3 = s.b['HOME'] + 12000 >= NEED_ORIG     # on/ahead of plan using insured savings only
        # T4 (v0.6): the open loan is "manageable" = loan-to-value at or below Keystone's own 50% maximum
        t4 = t2 and (s.K() / s.E() <= D('0.5'))
        # T5 (v0.6): home-purchase liquidity is NOT the priority only if Dana is already at least the bonus ($2,000) ahead of plan
        t5 = s.b['HOME'] + 12000 >= NEED_ORIG + 2000
        s.d5_cond = (t2, t3, t4, t5)
        # v0.6 scoring.  No Keystone loan: A = prepay the 6% student loan (on plan -> A or B; behind plan -> B only).
        # Keystone loan open: A = repay Keystone, rest to home savings.  A always earns credit.
        #   B also earns credit when the loan is manageable (T4) AND liquidity is the priority (not T5: not already $2,000+ ahead of plan).
        if t2: s.full['D5'] = {'A', 'B'} if (t4 and not t5) else {'A'}
        else:  s.full['D5'] = {'A', 'B'} if t3 else {'B'}
        s.tx(m, 'D5 bonus received', {'CHK': D(2000)}, 'bonus')
        if x == 'A':
            amt = D(2000)
            if t2:                                # v0.6: repay the Keystone loan, then ALL the remainder to home savings
                k = s.K(); s.pay_loan_cash(m, 'CHK', k, 'D5 A repay Keystone loan'); amt -= k
                s.tx(m, 'D5 A remainder to home savings', {'CHK': -amt, 'HOME': amt}, 'transfer')
            else:                                 # no Keystone loan: prepay the 6% student loan
                assert amt <= s.b['STU']
                s.tx(m, 'D5 A extra student-loan payment', {'CHK': -amt, 'STU': -amt}, 'transfer')
        elif x == 'B': s.tx(m, 'D5 B to home savings', {'CHK': D(-2000), 'HOME': D(2000)}, 'transfer')
        else: s.tx(m, 'D5 C to Apex Yield', {'CHK': D(-2000), 'APEX': D(2000)}, 'transfer')

    def recover20(s):
        if s.b['APEX'] > 0:
            a = s.b['APEX']; rec = r(a * D('0.55')); s.cost['losses'] += a - rec
            s.tx(20, 'Apex recovery plan pays 55%', {'APEX': -a, 'HOME': rec}, 'exploit_loss')

    def D6(s):
        x = s.ch[5]; m = 19; s.full['D6'] = {'A'}
        if x in 'AC':
            if s.b['KLP'] > 0: s.repay_with_collateral(m, 'D6 repay with collateral')
            if s.E() > 0: s.sell(m, s.E(), 'D6 sell remaining ETH')
            w = s.b['VAULT']
            if w > 0: s.tx(m, 'D6 vault -> home savings', {'VAULT': -w, 'HOME': w}, 'transfer')
            if x == 'C': s.docfee = DOCFEE
        else: s.docfee = DOCFEE; s.late = True

    def late23(s):
        m = 23
        if s.b['KLP'] > 0: s.repay_with_collateral(m, 'D6 B late: repay with collateral')
        if s.E() > 0: s.sell(m, s.E(), 'D6 B late: sell ETH')

    def late_withdraw(s, m):
        if s.late:
            w = min(s.b['VAULT'], D(6000))
            if w > 0: s.tx(m, 'D6 B: final-3-weeks vault withdrawal (cap 6,000)', {'VAULT': -w, 'HOME': w}, 'transfer')

    def need(s): return NEED_REV + s.docfee

    def project(s):
        """Projected home savings at the end of month 24 if Dana does nothing further (dry run)."""
        p = copy.deepcopy(s); p.log = None; p.bonus_pending = False
        p.cycle(23); p.cycle(24); p.late_withdraw(24)
        return p.b['HOME']

    # ---------- the run ----------
    def run(s):
        s.snap(0, 'opening')
        for m in range(1, 24):
            s.snap(m, 'opening balance')
            if m == 1: s.D1(); s.snap(m, 'after D1 decision (%s)' % s.ch[0])
            if m == 4: s.D2(); s.snap(m, 'after D2 decision (%s)' % s.ch[1])
            if m == 6: s.D3(); s.snap(m, 'after D3 decision (%s)' % s.ch[2])
            if m == 9:
                s.reprice(9, IDX[9], 'ETH index 60'); s.snap(m, 'decision-time D4 (ETH index 60)')
                s.D4(); s.snap(m, 'after D4 decision (%s)' % s.ch[3])
            if m == 11: s.liq11(); s.snap(m, 'after ETH index 42 / liquidation check')
            if m == 19:
                s.reprice(19, IDX[19], 'ETH index 55'); s.snap(m, 'decision-time D6 (ETH index 55)')
                s.D6(); s.snap(m, 'after D6 decision (%s)' % s.ch[5])
            if m == 20: s.recover20(); s.snap(m, 'after Apex recovery payment')
            if m < 23:
                s.cycle(m)
                if m == 12: s.snap(12, 'decision-time D5 (after month-12 cycle)'); s.D5(); s.snap(12, 'after D5 decision (%s)' % s.ch[4])
                s.snap(m, 'end of month (after month-end cycle)')
        # ---- month 23: D7
        m = 23
        s.reprice(m, IDX[23], 'ETH index 48')
        if s.late: s.late23()
        s.snap(23, 'decision-time D7 (before allocation)')
        if s.alloc and s.b['OTHER'] > 0:
            s.tx(m, 'Other cash -> home savings (unscored allocation)', {'OTHER': -s.b['OTHER'], 'HOME': s.b['OTHER']}, 'transfer')
        s.proj24 = s.project(); s.gap_dec = s.need() - s.proj24
        s.full['D7'] = {'C'} if s.gap_dec > 0 else {'B', 'C'}
        s.snap(23, 'decision-time D7 (after allocation; projection computed)')
        x = s.ch[6]; g = max(s.gap_dec, D(0)); a23 = a24 = D(0)
        if x == 'A':
            inv = min(D(5000), s.b['HOME'])
            s.tx(m, 'D7 A: home savings -> Surge Pool', {'HOME': -inv, 'POOL': inv}, 'transfer'); s.pool_in = inv
        if x == 'C': a23 = min(D(450), g); a24 = min(D(450), g - a23)
        s.cycle(23, redirect=a23)
        if s.b['POOL'] > 0:
            p = s.b['POOL']; back = r(p * D('0.96')); s.cost['losses'] += p - back
            s.tx(23, 'Surge Pool 30-day result: -4.0%', {'POOL': -p, 'HOME': back}, 'pool_loss')
        s.snap(23, 'end of month 23 (after month-end cycle and pool result)')
        s.cycle(24, redirect=a24); s.late_withdraw(24)
        s.snap(24, 'end of month 24: before closing check')
        s.rcover = D(0)
        gap = s.need() - s.b['HOME']
        s.b_blocked = False; s.b_warn = False
        if x == 'B' and gap > 0:
            if gap <= s.b['RES']:                       # v0.5: draw ONLY if it makes the purchase affordable now
                t = gap; s.rcover = t
                s.b_warn = (s.b['RES'] - t) < ESSENTIALS_ONE_MONTH
                s.tx(24, 'D7 B: emergency savings -> home savings' + (' (WARNING: reserve below one month of essentials)' if s.b_warn else ''),
                     {'RES': -t, 'HOME': t}, 'transfer')
                gap -= t
            else:
                s.b_blocked = True                      # draw refused: it could not complete the purchase; reserve untouched
        s.rebuild_from = None
        while gap > 0 and s.delay < 3:
            s.delay += 1
            s.cycle(24 + s.delay, fee=EXTFEE)
            gap = s.need() - s.b['HOME']
        s.gapfinal = gap
        s.status = 'ready' if (gap <= 0 and s.delay == 0) else 'ready_delay' if gap <= 0 else 'paused'
        s.snap(24 + s.delay, 'final')
        s.finish()
        return s

    def finish(s):
        assert abs(s.nw() - s.nw0 - sum(s.ext.values())) == 0, 'net-worth reconciliation failed'
        assert all(v >= 0 for v in s.b.values()) and s.u >= 0
        assert s.snaps == {} or True

    def reserve_months(s): return s.b['RES'] / ESSENTIALS_ONE_MONTH

    def score(s):
        keys = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']
        return sum(100 for i, k in enumerate(keys) if s.ch[i] in s.full[k])

def run(ch, alloc=False, logging=True): return Sim(ch, alloc, logging).run()
def f2(x): return '{:.2f}'.format(D(x))

def line(s):
    vt = s.b['VAULT'] + s.b['APEX'] + s.b['POOL']
    return '|'.join([s.ch, '1' if s.alloc else '0', s.status, str(s.delay), f2(s.b['HOME']), f2(s.b['RES']),
                     f2(s.b['OTHER']), f2(vt), f2(s.b['STU']), str(s.score()), f2(s.gapfinal)])

def all_lines():
    out = []
    for alloc in (False, True):
        for ch in itertools.product('ABC', repeat=7):
            out.append(line(run(''.join(ch), alloc, logging=False)))
    return out

def verify():
    from collections import Counter
    st = {False: Counter(), True: Counter()}; hist = Counter(); lines = []
    bstat = Counter(); low_res = Counter(); d7var = Counter(); d3c = 0; d5 = Counter(); minres = D(99999); maxscore = []
    for alloc in (False, True):
        for ch in itertools.product('ABC', repeat=7):
            ch = ''.join(ch); s = run(ch, alloc, logging=False)
            lines.append(line(s)); st[alloc][s.status] += 1
            if not alloc:
                hist[s.score()] += 1
                if s.score() == 700: maxscore.append(ch)
            if 'C' in s.full['D3'] - {'A'}: d3c += 1
            d5[(s.d5_cond, tuple(sorted(s.full['D5'])))] += 1
            d7var[(alloc, 'shortfall' if s.gap_dec > 0 else 'covered')] += 1
            if s.ch[6] == 'B' and s.gap_dec > 0:
                bstat[(alloc, 'blocked' if s.b_blocked else 'draw+warning' if s.b_warn else 'draw')] += 1
            minres = min(minres, s.b['RES'])
    h = hashlib.sha256('\n'.join(lines).encode()).hexdigest()
    print('runs:', len(lines), '  assertion failures: 0 (any failure raises)')
    print('status without allocation:', dict(st[False])); print('status with allocation   :', dict(st[True]))
    print('score histogram (no allocation):', dict(sorted(hist.items())))
    print('paths scoring 700:', maxscore)
    print('D3 full-credit set is {A} on every run (C earns credit on', d3c, 'runs)')
    print('D5 (T2 Keystone open, T3 on plan, T4 loan manageable, T5 $2,000+ ahead) -> full-credit set:', dict(d5))
    print('D7 variant counts:', dict(d7var))
    print('D7 B with a shortfall (alloc, outcome):', dict(sorted(bstat.items())), ' min final reserve:', minres)
    print('SHA-256 of', len(lines), 'canonical lines:', h, '(MATCHES published value)' if h == EXPECTED_SHA else '(DIFFERS from published value - diff against lines6.txt)')
    return lines, h

def money(x): return f2(x)

def schedule_print(s):
    hdr = ['month', 'phase', 'CHK', 'RES', 'HOME', 'OTHER', 'VAULT', 'APEX', 'POOL', 'ETH', 'pledged', 'STU', 'KLOAN', 'fees', 'int', 'loss', 'NW']
    print(','.join(hdr))
    for z in s.sched:
        print(','.join([str(z['month']), z['label'].replace(',', ';')] + [money(z[k]) for k in
              ['CHK', 'RES', 'HOME', 'OTHER', 'VAULT', 'APEX', 'POOL', 'ETH', 'PLEDGED', 'STU', 'KLOAN', 'FEES', 'INT', 'LOSS', 'NW']]))

def export(outdir):
    os.makedirs(outdir, exist_ok=True)
    for name, ch in (('PT1', 'BCACBAC'), ('PT2', 'CCCCBCC'), ('PT3', 'ABBACBA')):
        s = run(ch, False)
        with open(os.path.join(outdir, 'txlog_%s_%s.csv' % (name, ch)), 'w', newline='') as f:
            w = csv.writer(f); w.writerow(['seq', 'month', 'event', 'tag', 'account', 'delta', 'balance_after', 'eth_index', 'eth_units'])
            for row in s.log: w.writerow([row[0], row[1], row[2], row[3], row[4], f2(row[5]), f2(row[6]), '{:.10f}'.format(row[7]), '{:.10f}'.format(row[8])])
        with open(os.path.join(outdir, 'schedule_%s_%s.csv' % (name, ch)), 'w', newline='') as f:
            w = csv.writer(f)
            w.writerow(['month', 'phase', 'checking', 'emergency', 'home_savings', 'other_cash', 'vault', 'apex', 'pool', 'eth_value', 'eth_pledged', 'student_loan', 'keystone_loan', 'fees_paid', 'interest_paid', 'realized_losses', 'net_worth'])
            for z in s.sched:
                w.writerow([z['month'], z['label']] + [money(z[k]) for k in ['CHK', 'RES', 'HOME', 'OTHER', 'VAULT', 'APEX', 'POOL', 'ETH', 'PLEDGED', 'STU', 'KLOAN', 'FEES', 'INT', 'LOSS', 'NW']])
        print('wrote', name, ch, 'score', s.score(), s.status, 'delay', s.delay)

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--verify', action='store_true'); ap.add_argument('--path'); ap.add_argument('--alloc', action='store_true')
    ap.add_argument('--export'); ap.add_argument('--audit-all', action='store_true'); ap.add_argument('--lines', help='write canonical lines to file')
    a = ap.parse_args()
    if a.verify:
        lines, h = verify()
        if a.lines: open(a.lines, 'w').write('\n'.join(lines) + '\n')
    if a.path:
        s = run(a.path.upper(), a.alloc); schedule_print(s)
        print('status', s.status, 'delay', s.delay, 'score', s.score(), 'gap_at_D7', f2(s.gap_dec), 'final shortfall', f2(s.gapfinal))
    if a.export: export(a.export)
    if a.audit_all:
        import audit_ledger as AL                 # replays every run's transaction log with the independent auditor
        bad = 0
        for alloc in (False, True):
            for ch in itertools.product('ABC', repeat=7):
                s = run(''.join(ch), alloc, True)
                rows = [dict(seq=x[0], month=x[1], event=x[2], tag=x[3], account=x[4], delta=f2(x[5]), balance_after=f2(x[6]),
                             eth_index='{:.10f}'.format(x[7]), eth_units='{:.10f}'.format(x[8])) for x in s.log]
                errs = AL.audit(rows)[0]
                if errs: bad += 1; print(''.join(ch), alloc, errs[:3])
        print('independent audit of 4,374 transaction logs:', 'PASS' if not bad else 'FAIL (%d)' % bad)
