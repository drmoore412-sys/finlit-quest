"""Dana adapter: decision nodes from the locked Dana v0.6.1 engine (dana6.Sim, imported UNMODIFIED).

Node = answer prefix.  D1..D6 nodes are keyed by the prefix ('' .. 'BCACB'); the D7 node exists twice per
six-answer prefix: key `prefix` (Other-cash control unused) and `prefix + '+'` (control used).  The
allocation control is a node attribute, never an answer option, and never changes the three options.

The decision-time snapshot depends only on the prefix (+ alloc at D7): `check_prefix_independence` proves it.
Full-credit sets come from the engine's own `s.full[...]`, never re-derived.
"""
import itertools, re
from decimal import Decimal as D
from defi_rl_render import Ns

OPEN_LABEL = {0: ('opening balance', 1), 1: ('opening balance', 4), 2: ('opening balance', 6),
              3: ('decision-time D4', 9), 4: ('decision-time D5', 12), 5: ('decision-time D6', 19)}
AFTER_LABEL = {0: 'after D1 decision', 1: 'after D2 decision', 2: 'after D3 decision', 3: 'after D4 decision',
               4: 'after D5 decision', 5: 'after D6 decision'}
KEYS = ('CHK', 'RES', 'HOME', 'OTHER', 'VAULT', 'APEX', 'POOL', 'ETH', 'PLEDGED', 'STU', 'KLOAN', 'FEES', 'INT', 'LOSS', 'NW', 'IDX')
ACCTS = ('CHK', 'RES', 'HOME', 'OTHER', 'VAULT', 'APEX', 'POOL', 'ETH', 'STU', 'KLP', 'KLI')
OPENING = dict(CHK=D(1800), RES=D(8700), HOME=D(21000), OTHER=D(0), VAULT=D(0), APEX=D(0), POOL=D(0), ETH=D(2400),
               STU=D(12000), KLP=D(0), KLI=D(0))


def all_prefixes():
    """internal node keys: prefixes of length 0..6, plus the D7 alloc twin of every six-answer prefix"""
    for k in range(7):
        for t in itertools.product('ABC', repeat=k):
            yield ''.join(t)
    for t in itertools.product('ABC', repeat=6):
        yield ''.join(t) + '+'


def split_key(key):
    alloc = key.endswith('+')
    return (key[:-1] if alloc else key), alloc


def _snap(s, label, month=None):
    for sn in s.sched:
        if sn['label'].startswith(label) and (month is None or sn['month'] == month):
            return sn
    raise KeyError(label)


def ns_from_snap(sn):
    d = {k: sn[k] for k in KEYS}
    d['month'] = sn['month']
    d['ltv'] = (sn['KLOAN'] / sn['ETH'] * 100) if sn['ETH'] > 0 and sn['KLOAN'] > 0 else D(0)
    d['cash'] = sn['CHK'] + sn['RES'] + sn['HOME'] + sn['OTHER']
    return Ns(d)


class DanaData:
    def __init__(self, dana):
        self.dana = dana
        self._run = {}
        self.pad_letter = 'A'

    def run(self, path, alloc=False):
        k = (path, alloc)
        s = self._run.get(k)
        if s is None:
            s = self._run[k] = self.dana.Sim(path, alloc, logging=True).run()
        return s

    def pad(self, prefix):
        return prefix + self.pad_letter * (7 - len(prefix))

    # -- decision-time state --------------------------------------------------------------
    def pre_snap(self, key):
        prefix, alloc = split_key(key)
        k = len(prefix)
        s = self.run(self.pad(prefix), alloc)
        if k <= 5:
            lab, m = OPEN_LABEL[k]
            return _snap(s, lab, m)
        return _snap(s, 'decision-time D7 (after allocation')

    def pre_raw(self, key):
        """dict view used by the variant picker and the independence proof"""
        prefix, alloc = split_key(key)
        k = len(prefix)
        s = self.run(self.pad(prefix), alloc)
        d = dict(self.pre_snap(key))
        if k == 5 or k == 6:
            d['d5_cond'] = None
        if k == 4:
            d['d5_cond'] = tuple(s.d5_cond)
        if k == 3:
            d['d4var'] = s.d4var
        if k == 6:
            d['gap'] = s.gap_dec; d['proj'] = s.proj24; d['need'] = s.need(); d['late'] = s.late; d['docfee'] = s.docfee
        return d

    def rules(self, key):
        prefix, alloc = split_key(key)
        k = len(prefix)
        s = self.run(self.pad(prefix), alloc)
        full = s.full['D%d' % (k + 1)]
        return {L: (L in full, '') for L in 'ABC'}

    # -- ledger access ---------------------------------------------------------------------
    def eom_fn(self, path, alloc):
        s = self.run(path, alloc)
        def eom(M):
            out = dict(OPENING)
            for r in s.log:
                if r[1] <= M:
                    out[r[4]] = D(r[6])
            n = Ns(out)
            n['KLOAN'] = n.KLP + n.KLI
            n['cash'] = n.CHK + n.RES + n.HOME + n.OTHER
            return n
        return eom

    def row_fn(self, path, alloc):
        s = self.run(path, alloc)
        def row(M, event, acct):
            return sum((D(r[5]) for r in s.log if r[1] == M and r[4] == acct and r[2].startswith(event)), D(0))
        return row

    def after_snap(self, key, letter):
        prefix, alloc = split_key(key)
        k = len(prefix)
        s = self.run(self.pad(prefix + letter), alloc)
        if k <= 5:
            return _snap(s, AFTER_LABEL[k])
        return _snap(s, 'final')

    def next_snap(self, key, letter):
        prefix, alloc = split_key(key)
        k = len(prefix)
        if k >= 6:
            return Ns({})
        s = self.run(self.pad(prefix + letter), alloc)
        if k + 1 <= 5:
            lab, m = OPEN_LABEL[k + 1]
            return ns_from_snap(_snap(s, lab, m))
        return ns_from_snap(_snap(s, 'decision-time D7 (after allocation'))

    def ctx(self, key, letter, variant):
        prefix, alloc = split_key(key)
        k = len(prefix)
        path = self.pad(prefix + letter)
        s = self.run(path, alloc)
        pre = ns_from_snap(self.pre_snap(key))
        post = ns_from_snap(self.after_snap(key, letter))
        d = Ns({a: post[a] - pre[a] for a in KEYS + ('cash',)})
        fin = ns_from_snap(_snap(s, 'final'))
        rl = self.rules(key)[letter]
        ex = Ns({'status': s.status, 'delay': D(s.delay), 'gapfinal': s.gapfinal, 'rcover': s.rcover,
                 'blocked': bool(s.b_blocked), 'warn': bool(s.b_warn), 'late': bool(s.late),
                 'docfee': s.docfee, 'need': s.need(), 'cash_final': s.b['HOME']})
        c = {'pre': pre, 'post': post, 'd': d, 'fin': fin, 'run': ex, 'v': variant, 'alloc': alloc,
             'pts': 100 if rl[0] else 0, 'why': rl[1],
             'row': self.row_fn(path, alloc), 'eom': self.eom_fn(path, alloc), 'nx': self.next_snap(key, letter),
             'x': Ns({l.lower(): ns_from_snap(self.after_snap(key, l)) for l in 'ABC'})}
        c['ans'] = prefix
        if k == 3:
            c['s11'] = ns_from_snap(_snap(s, 'after ETH index 42', 11))
        if k == 6:
            c['d5'] = ns_from_snap(_snap(s, 'decision-time D5'))
            c['m24'] = ns_from_snap(_snap(s, 'end of month 24'))
            c['pre0'] = ns_from_snap(_snap(s, 'decision-time D7 (before'))
            c['gap'] = s.gap_dec; c['proj'] = s.proj24
        if k == 4:
            c['t'] = Ns({'t2': s.d5_cond[0], 't3': s.d5_cond[1], 't4': s.d5_cond[2], 't5': s.d5_cond[3]})
        return c


def check_prefix_independence(data):
    """decision-time state must not depend on later answers; compares pads A/B/C on every node."""
    bad = 0
    for key in all_prefixes():
        base = {k: str(v) for k, v in data.pre_raw(key).items()}
        prefix, alloc = split_key(key)
        for tail in 'BC':
            alt = DanaData(data.dana)
            alt.pad_letter = tail
            if {k: str(v) for k, v in alt.pre_raw(key).items()} != base:
                bad += 1
    return bad
