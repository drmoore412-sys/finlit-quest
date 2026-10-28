#!/usr/bin/env python3
"""
FinLit Quest - DeFi in Real Life, Batch 1 financial-model CORE (v0.1 DRAFT, not approved).
Shared by zoe.py, maya.py, jules.py, marcus.py, elena.py.  Standard library only.
This is a CURRICULUM VALIDATION TOOL, not game code.  Money is Decimal, rounded half-up to the cent.
Every balance change goes through Sim.tx(), which writes a transaction log (seq, month, event, tag, account, delta, balance_after).
audit_models.py re-verifies those logs WITHOUT importing this file.
"""
import csv, hashlib, itertools, os
from decimal import Decimal as D, ROUND_HALF_UP, getcontext
getcontext().prec = 40

def r(x): return D(x).quantize(D('0.01'), ROUND_HALF_UP)
def f2(x): return '{:.2f}'.format(D(x))

class Sim:
    def __init__(s, name, assets, liabs, opening, repriced=None):
        s.name = name; s.assets = list(assets); s.liabs = list(liabs)
        s.b = {a: D(0) for a in s.assets + s.liabs}
        for k, v in opening.items(): s.b[k] = D(v)
        s.log = []; s.seq = 0; s.sched = []; s.cum = {}
        s.ev = {}; s.flags = {}; s.declined = []; s.idx = D(100); s.notes = []
        s.open_nw = s.nw()
    def nw(s): return sum(s.b[a] for a in s.assets) - sum(s.b[a] for a in s.liabs)
    def tx(s, m, event, tag, d):
        s.seq += 1; eff = D(0)
        for a, v in d.items():
            v = D(v)
            if v == 0: continue
            assert a in s.b, ('unknown account', a)
            s.b[a] += v
            assert s.b[a] >= 0, ('NEGATIVE balance', a, s.b[a], event, m)
            eff += v if a in s.assets else -v
            s.log.append((s.seq, m, event, tag, a, f2(v), f2(s.b[a])))
        s.cum[tag] = s.cum.get(tag, D(0)) + eff
        if tag == 'transfer': assert eff == 0, ('transfer with net-worth effect', event, eff)
    def snap(s, m, label):
        z = {'month': m, 'label': label, 'NW': s.nw()}; z.update(s.b); s.sched.append(z)
    def at(s, m, fn): s.ev.setdefault(m, []).append(fn)
    def decline(s, m, event, why):
        s.declined.append((m, event, why)); s.seq += 1
        s.log.append((s.seq, m, 'DECLINED: ' + event + ' (' + why + ')', 'declined', '-', '0.00', '0.00'))
    def take(s, m, event, amt, srcs, dst, tag='transfer'):
        """move up to amt from the first sources that have money into dst; returns amount moved"""
        amt = D(amt); got = D(0)
        for a in srcs:
            t = min(s.b[a], amt - got)
            if t > 0:
                s.tx(m, event, tag, {a: -t, dst: +t}); got += t
            if got >= amt: break
        return got
    def buy(s, m, event, amt, srcs, dst, fee_rate='0.005'):
        """buy an asset: all-or-nothing, fee fee_rate; returns True if bought"""
        amt = D(amt); avail = sum(s.b[a] for a in srcs)
        if avail < amt:
            s.decline(m, event, 'needs %s, only %s available' % (f2(amt), f2(avail))); return False
        fee = r(amt * D(fee_rate)); net = amt - fee; left = amt
        for a in srcs:
            t = min(s.b[a], left)
            if t > 0:
                part_fee = r(t * D(fee_rate)) if t < amt else fee
                s.tx(m, event, 'transfer', {a: -(t - part_fee), dst: +(t - part_fee)})
                s.tx(m, event + ' fee', 'fee', {a: -part_fee}); left -= t
            if left <= 0: break
        return True
    def reprice(s, m, new_idx, accts, why='market move'):
        """market move: each (account, exponent) is repriced by (new/old)**exponent; tag 'market'"""
        new_idx = D(new_idx); ratio = new_idx / s.idx
        for a, e in accts:
            if s.b[a] > 0:
                f = ratio ** D(e); s.tx(m, why + ' (' + a + ')', 'market', {a: r(s.b[a] * f) - s.b[a]})
        s.idx = new_idx

def write_csv(path, header, rows):
    with open(path, 'w', newline='') as f:
        w = csv.writer(f); w.writerow(header); w.writerows(rows)

def export(s, outdir, tag):
    os.makedirs(outdir, exist_ok=True)
    write_csv(os.path.join(outdir, 'txlog_%s_%s.csv' % (s.name, tag)), ['seq', 'month', 'event', 'tag', 'account', 'delta', 'balance_after'], s.log)
    cols = ['month', 'label'] + s.assets + s.liabs + ['NW']
    write_csv(os.path.join(outdir, 'schedule_%s_%s.csv' % (s.name, tag)), cols, [[z['month'], z['label']] + [f2(z[c]) for c in cols[2:]] for z in s.sched])
