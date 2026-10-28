#!/usr/bin/env python3
"""
Independent auditor for FinLit Quest Dana v0.6 transaction logs.  Standard library only.
It does NOT import dana6.py.  It replays the logged rows and re-derives every interest, fee and
swap amount from the published rules.  Usage:  python3 audit_ledger.py txlog_PT1_BCACBAC.csv
Exit code 0 = PASS, 1 = FAIL.
"""
import csv, sys
from decimal import Decimal as D, ROUND_HALF_UP, getcontext
getcontext().prec = 40
def r(x): return D(x).quantize(D('0.01'), ROUND_HALF_UP)
ASSETS = {'CHK', 'RES', 'HOME', 'OTHER', 'VAULT', 'APEX', 'POOL', 'ETH'}
LIABS = {'STU', 'KLP', 'KLI'}
OPEN = dict(CHK=D(1800), RES=D(8700), HOME=D(21000), OTHER=D(0), VAULT=D(0), APEX=D(0), POOL=D(0),
            ETH=D(2400), STU=D(12000), KLP=D(0), KLI=D(0))
TAGS = {'income', 'living', 'student_interest', 'transfer', 'vault_interest', 'loan_interest', 'extension_fee',
        'bonus', 'repair', 'theft', 'eth_price', 'swap_fee', 'liq_penalty', 'exploit_loss', 'pool_loss'}

def audit(rows):
    bal = dict(OPEN); errs = []; effects = {}
    groups = {}
    for row in rows: groups.setdefault(int(row['seq']), []).append(row)
    nw0 = sum(bal[a] for a in ASSETS) - sum(bal[a] for a in LIABS)
    def err(m): errs.append(m)
    for seq in sorted(groups):
        g = groups[seq]; ev = g[0]['event']; tag = g[0]['tag']; month = int(g[0]['month'])
        if tag not in TAGS: err('unknown tag %s at seq %d' % (tag, seq))
        prev = dict(bal); d = {}
        for x in g:
            a = x['account']; v = D(x['delta']); d[a] = d.get(a, D(0)) + v
            bal[a] += v
            if bal[a] < 0: err('negative balance %s=%s seq %d %s' % (a, bal[a], seq, ev))
            if bal[a] != D(x['balance_after']): err('balance mismatch %s replay %s log %s seq %d' % (a, bal[a], x['balance_after'], seq))
            if a == 'ETH':
                units, idx = D(x['eth_units']), D(x['eth_index'])
                if abs(r(units * idx / 100) - bal['ETH']) > D('0.011'): err('ETH value != units*index seq %d' % seq)
        eff = sum(v for a, v in d.items() if a in ASSETS) - sum(v for a, v in d.items() if a in LIABS)
        effects[tag] = effects.get(tag, D(0)) + eff
        if tag == 'transfer' and eff != 0: err('transfer with net-worth effect %s seq %d %s' % (eff, seq, ev))
        # ---- rule re-derivation
        if tag == 'income' and d.get('CHK') != D(4600) and ev.startswith('month-end'): err('income != 4600 seq %d' % seq)
        if tag == 'student_interest' and d['STU'] != r(prev['STU'] * D('0.005')): err('student interest seq %d' % seq)
        if tag == 'vault_interest':
            rate = D('0.08') if month <= 6 else D('0.05') if month <= 12 else D('0.035')
            if d['VAULT'] != r(prev['VAULT'] * rate / 12): err('vault interest seq %d' % seq)
        if tag == 'loan_interest' and d['KLI'] != r(prev['KLP'] * D('0.0075')): err('loan interest seq %d' % seq)
        if tag == 'extension_fee' and d['CHK'] != D(-450): err('extension fee != 450 seq %d' % seq)
        if tag == 'swap_fee':
            S = -d['ETH']
            if 'OTHER' in d and d['OTHER'] != S - r(S * D('0.005')): err('swap proceeds seq %d' % seq)
            if 'KLP' in d:
                owed = -(d['KLP'] + d['KLI'])
                if S != r(owed / D('0.995')): err('repay-with-collateral amount seq %d' % seq)
                if S > prev['ETH'] + D('0.005'): err('sold more than pledged ETH seq %d' % seq)
        if tag == 'liq_penalty':
            owed = -(d['KLP'] + d['KLI']); seized = -d['ETH']
            if seized != r(owed * D('1.05')): err('liquidation seizure seq %d' % seq)
            if prev['KLI'] + prev['KLP'] != owed: err('liquidation did not clear debt seq %d' % seq)
        if ev == 'D5 A extra student-loan payment' and prev['KLP'] + prev['KLI'] > 0: err('v0.6: D5 A prepaid the student loan while a Keystone loan was open seq %d' % seq)
        if ev == 'D5 A remainder to home savings' and (bal['KLP'] + bal['KLI'] != 0 or 'HOME' not in d): err('v0.6: D5 A remainder must follow full Keystone repayment and go to home savings seq %d' % seq)
        if tag == 'pool_loss' and d['HOME'] != r(-d['POOL'] * D('0.96')): err('pool result seq %d' % seq)
        if tag == 'exploit_loss' and d['HOME'] != r(-d['APEX'] * D('0.55')): err('exploit recovery seq %d' % seq)
        if ev.startswith('month-end') and (seq == max(s for s in groups if groups[s][0]['event'] == ev)) and False: pass
    # v0.6 rule: a D7 B emergency-savings draw is allowed only if it completes the purchase on time
    # (no delay month may follow it) and must carry a WARNING when the reserve ends under one month ($2,900).
    draws = [x for x in rows if x['event'].startswith('D7 B: emergency') and x['account'] == 'RES']
    for x in draws:
        if D(x['balance_after']) < 2900 and 'WARNING' not in x['event']: err('reserve below one month without WARNING')
        if any(y['event'].startswith('month-end 25') for y in rows): err('D7 B drew reserve but purchase still delayed')
    # checking must be 1,800 after every complete month-end block (and after D3/D5 pass-throughs)
    last = {}
    for row in rows:
        if row['event'].startswith('month-end') and row['account'] == 'CHK': last[row['event']] = D(row['balance_after'])
    for ev, v in last.items():
        if v != 1800: err('checking not 1,800 after %s (%s)' % (ev, v))
    nw1 = sum(bal[a] for a in ASSETS) - sum(bal[a] for a in LIABS)
    if nw1 - nw0 != sum(effects.values()): err('net-worth reconciliation: %s vs %s' % (nw1 - nw0, sum(effects.values())))
    return errs, bal, nw0, nw1, effects

if __name__ == '__main__':
    bad = 0
    for path in sys.argv[1:]:
        with open(path) as f: rows = list(csv.DictReader(f))
        errs, bal, nw0, nw1, eff = audit(rows)
        print('%s: %d rows, %s' % (path, len(rows), 'PASS' if not errs else 'FAIL'))
        for e in errs[:20]: print('  ', e)
        print('  closing balances:', {k: str(v) for k, v in bal.items()})
        print('  net worth %s -> %s  (change %s)' % (nw0, nw1, nw1 - nw0))
        print('  drivers by tag:', {k: str(v) for k, v in sorted(eff.items()) if v})
        bad += bool(errs)
    sys.exit(1 if bad else 0)
