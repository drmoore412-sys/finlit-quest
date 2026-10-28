"""Decision-node extraction from the locked Batch 1 engine (read-only use of models.py / scoring.py).

A node is an answer prefix.  The state shown at question k depends only on the first k answers
(`s.decs[k]` is captured before the decision), so any completion of the prefix gives the same
snapshot; the exporter proves this on every prefix in `check_prefix_independence`.

Option effects are the engine's own ledger rows for that decision (events tagged "D<k+1> ...",
and "DECLINED: D<k+1> ..."), taken from the run that chooses that option.
"""
import itertools, re
from decimal import Decimal as D
from defi_rl_render import Ns

OPT = 'abc'
LET = 'ABC'

AGG = {
    'elena': lambda n: {'cash': n.CHK + n.RES},
    'maya': lambda n: {'cash': n.CHK + n.SAV},
    'jules': lambda n: {'cash': n.CHK + n.RES},
    'marcus': lambda n: {'cash': n.BIZ + n.PER + n.EMER},
    'zoe': lambda n: {'cash': n.CHK + n.SAV + n.TUI},
}


def ns_with_agg(slug, d):
    n = Ns({k: (v if not isinstance(v, (int, float)) or isinstance(v, bool) else D(v)) for k, v in d.items()})
    n.update(AGG[slug](n))
    return n


class Batch1Data:
    def __init__(self, slug, models, scoring):
        self.slug, self.models, self.scoring = slug, models, scoring
        self._run = {}
        self.pad_letter = 'A'

    def run(self, path):
        s = self._run.get(path)
        if s is None:
            s = self._run[path] = self.models.CH[self.slug](path)
        return s

    def pad(self, prefix):
        return prefix + self.pad_letter * (7 - len(prefix))

    def pre_raw(self, prefix):
        k = len(prefix)
        raw = self.run(self.pad(prefix)).decs[k]
        if self.slug == 'marcus' and k == 0:
            # locked model quirk (documented in the Marcus journey, implementation requirement 1): the stored Q1 snapshot is taken
            # AFTER the player's conversion.  Rebuild the true pre-choice state by reversing that decision's own ledger rows.
            raw = dict(raw)
            for r in self.effect_rows(prefix, self.pad_letter):   # the run that produced `raw` chose pad_letter at Q1
                if not r[2].startswith('DECLINED'):
                    raw[r[4]] = raw[r[4]] - D(r[5])
        return raw

    def rules(self, prefix):
        k = len(prefix)
        s = self.run(self.pad(prefix))
        return self.scoring.RULES[self.slug](k, s.decs[k])

    def effect_rows(self, prefix, letter):
        k = len(prefix)
        s = self.run(self.pad(prefix + letter))
        m = s.decs[k]['m']
        tag = re.compile(r'^(DECLINED: )?D%d\b' % (k + 1))
        rows = [r for r in s.log if r[1] == m and (tag.match(r[2]) or self._recurring(k, r))]
        return rows

    def _recurring(self, k, r):
        # Maya Q2: the contribution is a recurring ledger row (tag 'retire') that starts in the decision month, not a 'D2' row.
        if self.slug == 'maya' and k == 1 and r[3] == 'retire':
            return True
        # Zoe Q6: the $35 late fee is booked as its own row right after the decision rows, in the same month.
        return self.slug == 'zoe' and k == 5 and r[2] in ('late fee', 'landlord split fee')

    def effect(self, prefix, letter):
        """-> (deltas by account (Decimal), fee total (positive), declined flag, rows)"""
        rows = self.effect_rows(prefix, letter)
        d, fee, declined = {}, D(0), False
        for r in rows:
            if r[2].startswith('DECLINED'):
                declined = True
                continue
            amt = D(r[5])
            d[r[4]] = d.get(r[4], D(0)) + amt
            if r[3] == 'fee' and amt < 0:
                fee += -amt
        return d, fee, declined, rows

    def eom_fn(self, path):
        """balances at the end of month M, replayed from the engine's own transaction log (balance_after column)"""
        s = self.run(path)
        first, lastby = {}, {}
        for r in s.log:
            if r[4] == '-':
                continue
            first.setdefault(r[4], D(r[6]) - D(r[5]))
        def eom(M):
            out = {a: v for a, v in first.items()}
            for r in s.log:
                if r[4] != '-' and r[1] <= M:
                    out[r[4]] = D(r[6])
            n = Ns(out)
            n.update(AGG[self.slug](n))
            return n
        return eom

    def next_state(self, prefix, letter):
        """the state shown at the NEXT decision; it depends only on prefix + letter (proved by the prefix-independence check)"""
        k = len(prefix)
        if k >= 6:
            return Ns({})
        raw = self.run(self.pad(prefix + letter)).decs[k + 1]
        return ns_with_agg(self.slug, raw)

    def row_fn(self, path):
        """sum of ledger amounts in month M for rows whose event starts with `event` on `acct` (replayed from the engine's own log)"""
        s = self.run(path)
        def row(M, event, acct):
            return sum((D(r[5]) for r in s.log if r[1] == M and r[4] == acct and r[2].startswith(event)), D(0))
        return row

    def later(self, prefix, letter):
        """follow-up rows of the same decision in later months, and market moves on the accounts it touched"""
        k = len(prefix)
        s = self.run(self.pad(prefix + letter))
        m = s.decs[k]['m']
        tag = re.compile(r'^D%d\b' % (k + 1))
        fu = [r for r in s.log if r[1] > m and tag.match(r[2])]
        d, fee = {}, D(0)
        for r in fu:
            amt = D(r[5]); d[r[4]] = d.get(r[4], D(0)) + amt
            if r[3] == 'fee': fee += -amt
        touched = {r[4] for r in self.effect_rows(prefix, letter)}
        last = max([r[1] for r in fu], default=m)
        mk = {}
        for r in s.log:
            if r[3] == 'market' and m < r[1] <= last and r[4] in touched:
                mk[r[4]] = mk.get(r[4], D(0)) + D(r[5])
        return Ns({'d': Ns(d), 'fee': fee, 'mkt': Ns(mk)})

    def post_of(self, prefix, letter, pre=None):
        pre = pre if pre is not None else ns_with_agg(self.slug, self.pre_raw(prefix))
        d, fee, declined, _ = self.effect(prefix, letter)
        post = Ns(pre)
        for a, v in d.items():
            post[a] = post.get(a, D(0)) + v
        post.update(AGG[self.slug](post))
        return post, d, fee, declined

    def ctx(self, prefix, letter, variant):
        pre = ns_with_agg(self.slug, self.pre_raw(prefix))
        post, d, fee, declined = self.post_of(prefix, letter, pre)
        dn = Ns(d)
        dn.update(AGG[self.slug](dn))
        x = Ns({l.lower(): self.post_of(prefix, l, pre)[0] for l in LET})
        rl = self.rules(prefix)[letter]
        vp = variant.split('_') if variant.count('_') == 2 and variant[0] in 'abc' else ['', '', '']
        return {'pre': pre, 'post': post, 'd': dn, 'fee': fee, 'declined': declined, 'v': variant, 'x': x,
                'pts': 100 if rl[0] else 0, 'why': rl[1], 'lh': 'LEAST' in rl[1], 'va': vp[0], 'vb': vp[1], 'vc': vp[2],
                'row': self.row_fn(self.pad(prefix + letter)), 'nx': self.next_state(prefix, letter),
                'lt': self.later(prefix, letter), 'eom': self.eom_fn(self.pad(prefix + letter))}


def all_prefixes():
    for k in range(7):
        for t in itertools.product(LET, repeat=k):
            yield ''.join(t)


def check_prefix_independence(data):
    """decs[k] must not depend on later answers (proof that a state can be shown before the answer)."""
    bad = 0
    for p in all_prefixes():
        base = data.pre_raw(p)
        for tail in ('B', 'C'):
            alt = data.run(p + tail * (7 - len(p))).decs[len(p)]
            if {k: str(v) for k, v in alt.items()} != {k: str(v) for k, v in base.items()}:
                bad += 1
    return bad
