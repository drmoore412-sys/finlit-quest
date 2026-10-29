#!/usr/bin/env python3
"""DeFi in Real Life -- decision-tree exporter (Phase 4, LOCAL ONLY, not released).

Reads ONLY the pinned, locked engines under
  curriculum/defi-real-life/approved/workbooks/engine/
and the human-edited journey workbooks next to them, and writes versioned runtime JSON
  curriculum/defi-real-life/approved/runtime/<slug>.tree.v1.json
plus a PASS/FAIL report in .../reports/.

Nothing is written unless EVERY gate passes:
  G1  engine file SHA-256 pins (models, scoring, fl_engine, dana6, audit_ledger)
  G2  Batch 1 regression hash: 10,935 score lines (5 characters x 2,187 paths)  9803dce5...92c8
  G3  Dana regression hash: 4,374 canonical lines                               29054a01...1b7
  G4  tree scores == engine scores on every path, for every character (parity)
  G10 Educational Terminology Standard (no invented provider/product names in player-facing text)
This script never edits the locked models, scoring or text sources.
"""
import hashlib, itertools, json, os, sys
from decimal import Decimal as D

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
APPROVED = os.path.join(ROOT, 'curriculum', 'defi-real-life', 'approved')
ENGINE = os.path.join(APPROVED, 'workbooks', 'engine')
RUNTIME = os.path.join(APPROVED, 'runtime')
REPORTS = os.path.join(APPROVED, 'reports')

PINS = {
    'models.py': '16935ec4031cfbfb868869e84243571e24ba298c0a898e188f04f0c12ff1e784',
    'scoring.py': '9a8ad0df965ca889cdd3518be60833bbedbad6c34e4ac07e53d3b30a62806a23',
    'fl_engine.py': '7b03880d7706e12aec77d998f69840b5b595aec31b95e2550406269bbb18e8ec',
    'dana6.py': '1d45f0e697d56af4e2c8ec15384c79e68828e19ba2249ce796afa3d453ef8a53',
    'audit_ledger.py': '465876d77c46450eac4002a1d447d9f7471f814e959acc22db9d4d7d1a12ad06',
    'lines_v62.txt': '9803dce547777b2d5be8c00640b4b847a5204a9b3c263cccebaa08b0562392c8',
    'lines6.txt': '134a34e705bb057c006cd09e33fc19c1472c4e88034f1a44cd68f8da365068f3',
}
BATCH1_HASH = '9803dce547777b2d5be8c00640b4b847a5204a9b3c263cccebaa08b0562392c8'
DANA_HASH = '29054a01363f117ee6cfeb51adc45f80f0f3b6bd2534573eb3021337841b81b7'
BATCH1 = ['zoe', 'maya', 'jules', 'marcus', 'elena']
SLUGS = BATCH1 + ['dana']
OPT = 'abc'


class GateFailure(Exception):
    pass


def sha(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def load_engines():
    sys.path.insert(0, ENGINE)
    sys.dont_write_bytecode = True
    import importlib
    return importlib.import_module('models'), importlib.import_module('scoring'), importlib.import_module('dana6')


def gate_pins():
    bad = []
    for name, want in PINS.items():
        p = os.path.join(ENGINE, name)
        got = sha(p) if os.path.exists(p) else 'MISSING'
        if got != want:
            bad.append((name, want, got))
    if bad:
        raise GateFailure('G1 engine pins differ: %r' % (bad,))
    return {k: v for k, v in PINS.items()}


def batch1_lines(models, scoring):
    lines = []
    for n, f in models.CH.items():
        for p in (''.join(x) for x in itertools.product('ABC', repeat=7)):
            s = f(p)
            sc = scoring.score_path(n, s, p)
            lines.append('%s,%s,%d,%s' % (n, p, sum(x[0] for x in sc), ','.join(str(x[0]) for x in sc)))
    return lines


def gate_batch1(models, scoring):
    lines = batch1_lines(models, scoring)
    h = hashlib.sha256(('\n'.join(lines) + '\n').encode()).hexdigest()
    if len(lines) != 10935 or h != BATCH1_HASH:
        raise GateFailure('G2 Batch 1 regression hash %s (%d lines) != %s' % (h, len(lines), BATCH1_HASH))
    return h, len(lines)


def gate_dana(dana):
    out = dana.all_lines()
    h = hashlib.sha256('\n'.join(out).encode()).hexdigest()
    if len(out) != 4374 or h != DANA_HASH:
        raise GateFailure('G3 Dana regression hash %s (%d lines) != %s' % (h, len(out), DANA_HASH))
    return h, len(out)


def money(x):
    return '{:.2f}'.format(D(x))


# ---------------------------------------------------------------------------------------------
# Journey workbooks, rendering and tree building (Batch 1 characters; Dana has her own adapter)
# ---------------------------------------------------------------------------------------------
import re
sys.path.insert(0, HERE)
import defi_rl_render as R
import defi_rl_nodes as N
import defi_rl_variants as V

WORKBOOKS = os.path.join(APPROVED, 'workbooks')


def load_journey(slug):
    with open(os.path.join(WORKBOOKS, slug + '.journey.json'), encoding='utf-8') as f:
        return json.load(f)


import defi_rl_dana as X


class Adapter:
    """Uniform view of a character's decision tree: node keys, their level, the engine data and the variant picker."""
    def __init__(self, slug, models, scoring, dana):
        self.slug = slug
        if slug == 'dana':
            self.data = X.DanaData(dana)
            self.keys = list(X.all_prefixes())
            self.level = lambda key: len(X.split_key(key)[0])
        else:
            self.data = N.Batch1Data(slug, models, scoring)
            self.keys = list(N.all_prefixes())
            self.level = len
        self.variant = V.VARIANT[slug]


def pick(val, variant):
    """a journey field may be one string or a {variant: string} map"""
    if isinstance(val, dict):
        return val.get(variant, '')
    return val or ''


def find_node_for_case(ad, k, case_rp, case_when, letter):
    """Return the node key used to check a feedback case's reference text."""
    if case_rp:
        if len(case_rp) != k:
            raise ValueError('reference path %r must have %d answers' % (case_rp, k))
        return case_rp
    for p in (p for p in ad.keys if ad.level(p) == k):
        v = ad.variant(k, ad.data.pre_raw(p))
        ctx = ad.data.ctx(p, letter, v)
        if R.evaluate(case_when, ctx):
            return p
    raise ValueError('no node satisfies case')


def pick_case(cases, ctx):
    for c in cases:
        if R.evaluate(c['when'], ctx):
            return c
    raise ValueError('no feedback case matched: v=%s' % ctx.get('v'))


def show_items(shows, ctx):
    for sh in shows:
        if ctx['v'] in sh['v']:
            items = []
            for it in sh['items']:
                if len(it) > 2 and not R.evaluate(it[2], ctx):
                    continue
                items.append([it[0], R.render(it[1], ctx)])
            note = R.render(sh['note'], ctx) if sh.get('note') else ''
            return items, note
    raise ValueError('no show block for variant %s' % ctx['v'])


def verify_journey(slug, models, scoring, dana=None, strict_ref=True):
    """Round-trip + semantic checks.  Returns a dict of results; raises nothing (caller decides)."""
    J = load_journey(slug)
    ad = Adapter(slug, models, scoring, dana)
    data = ad.data
    res = {'slug': slug, 'cases': 0, 'ref_match': 0, 'ref_deviation': [], 'ref_fail': [], 'assert_fail': [],
           'claim_fail': [], 'no_case': []}
    # 1. reference round trip
    for q in J['questions']:
        k = q['n'] - 1
        for L, cases in q['feedback'].items():
            letter = L.upper()
            for c in cases:
                res['cases'] += 1
                try:
                    p = find_node_for_case(ad, k, c['rp'], c['when'], letter)
                    v = ad.variant(k, data.pre_raw(p))
                    ctx = data.ctx(p, letter, v)
                    out = R.render(c['text'], ctx)
                except Exception as e:  # noqa
                    res['ref_fail'].append((c['dk'], 'render error: %r' % (e,)))
                    continue
                if c.get('pending'):
                    res['ref_deviation'].append((c['dk'], 'pending: ' + c['pending']))
                    if c.get('ref') is None:
                        continue
                if c.get('approved'):
                    # an approved text-only correction replaces the locked sentence: no round trip to the old text; asserts below still apply
                    res['ref_deviation'].append((c['dk'], 'approved correction: ' + c['approved'] + '. ' + c.get('dev', '')))
                    continue
                if c.get('refre'):
                    if re.fullmatch(c['refre'], R.norm(out)):
                        res['ref_match'] += 1
                        res['ref_deviation'].append((c['dk'], 'locked text has $[..] placeholders: all fixed words match; the figures are checked by asserts'))
                    else:
                        res['ref_fail'].append((c['dk'], R.norm(out), 'REGEX ' + c['refre']))
                elif R.norm(out) == R.norm(c['ref']):
                    res['ref_match'] += 1
                    if c.get('dev'):
                        res['ref_deviation'].append((c['dk'], c['dev']))
                else:
                    res['ref_fail'].append((c['dk'], R.norm(out), R.norm(c['ref'])))
    # 2. every node: a case matches for every option; asserts; points claims
    nodes = 0
    for p in ad.keys:
        k = ad.level(p)
        q = J['questions'][k]
        st = data.pre_raw(p)
        v = ad.variant(k, st)
        rules = data.rules(p)
        for letter in 'ABC':
            ctx = data.ctx(p, letter, v)
            try:
                c = pick_case(q['feedback'][letter.lower()], ctx)
            except ValueError as e:
                res['no_case'].append((p, letter, str(e)))
                continue
            if c.get('assert') and not R.evaluate(c['assert'], ctx):
                res['assert_fail'].append((p, letter, c['dk'], c['assert']))
            out = R.render(c['text'], ctx)
            pts = 100 if rules[letter][0] else 0
            if re.search(r'\bearns 100\b', out) and pts != 100:
                res['claim_fail'].append((p, letter, c['dk'], 'text says earns 100 but engine scores 0'))
            if re.search(r'\bscores 0\b|\bscored 0\b', out) and pts != 0:
                res['claim_fail'].append((p, letter, c['dk'], 'text says scores 0 but engine scores 100'))
        nodes += 1
    res['nodes'] = nodes
    return res


LETTER_REF = re.compile(r'\b(?:Option|option|answer|Answer|choice|Choice)s?\s+[ABC]\b|\([ABC]\)|\b(?:as|than|versus|vs\.?)\s+[ABC]\b(?!\w)|(?<![\w$])[ABC]\s+(?:and|or)\s+[ABC]\b(?!\w)')


def letter_refs(strings):
    return [s for s in strings if LETTER_REF.search(s)]


class Strings:
    def __init__(self):
        self.list, self.idx = [], {}

    def add(self, s):
        if s is None or s == '':
            return -1
        i = self.idx.get(s)
        if i is None:
            i = self.idx[s] = len(self.list)
            self.list.append(s)
        return i


def opt_id(slug, n, letter):
    return 'defi.%s.q%d.opt_%s' % (slug, n, letter.lower())


def build_tree(slug, models, scoring, prov, pad='A', dana=None):
    J = load_journey(slug)
    ad = Adapter(slug, models, scoring, dana)
    data = ad.data
    data.pad_letter = pad
    S = Strings()
    qmeta, nodes = [], {}
    pending = sorted(J.get('pending_wording', []) or set(c['pending'] for q in J['questions'] for cs in q['feedback'].values() for c in cs if c.get('pending')))
    for q in J['questions']:
        n = q['n']
        tk = q.get('takeaway', '')
        qmeta.append({'id': 'defi.%s.q%d' % (slug, n), 'n': n, 'month': q['month'], 'title': S.add(q['title']), 'rung': S.add(q.get('rung', '')),
                      'lead': S.add(q.get('lead', '')), 'disc': S.add(q.get('disclosure', '')),
                      'tk': S.add(tk) if isinstance(tk, str) else -1,
                      'opts': [opt_id(slug, n, l) for l in 'abc']})
    for p in ad.keys:
        k = ad.level(p)
        q = J['questions'][k]
        n = q['n']
        st = data.pre_raw(p)
        v = ad.variant(k, st)
        rules = data.rules(p)
        ctx0 = data.ctx(p, 'A', v)
        items, note = show_items(q['show'], ctx0)
        node = {'v': 'defi.%s.q%d.var_%s' % (slug, n, v),
                'sit': S.add(R.render(pick(q.get('situation', ''), v), ctx0)),
                'show': [[S.add(a), S.add(b)] for a, b in items], 'note': S.add(note), 'o': []}
        # optional explanation blocks (Dana): why, after-answer note, per-variant takeaway, comparison table
        if 'pre0' in ctx0 and ctx0['pre0'].OTHER > 0:
            node['ac'] = 1          # the unscored Other-cash control is offered on this screen (Dana D7)
        if q.get('why'):
            node['w'] = S.add(R.render(pick(q['why'], v), ctx0))
        if q.get('after'):
            node['aft'] = S.add(R.render(pick(q['after'], v), ctx0))
        if isinstance(q.get('takeaway'), dict):
            node['tk'] = S.add(pick(q['takeaway'], v))
        cm = (q.get('cmp') or {}).get(v)
        if cm:
            node['cmp'] = {'h': [S.add(h) for h in cm['h']],
                           'r': [[S.add(r[0])] + [S.add(R.render(x, ctx0)) for x in r[1:]] for r in cm['rows']]}
        for letter in 'ABC':
            ctx = data.ctx(p, letter, v)
            c = pick_case(q['feedback'][letter.lower()], ctx)
            spec = q['options'][letter.lower()]
            t = spec['t']
            for var_t in spec.get('tv', []):
                if ctx['v'] in var_t['v']:
                    t = var_t['t']
            o = {'t': S.add(R.render(t, ctx)), 'p': 100 if rules[letter][0] else 0, 'f': S.add(R.render(c['text'], ctx))}
            un = spec.get('unavail')
            if un and R.evaluate(un['when'], ctx):
                o['u'] = S.add(R.render(un['label'], ctx))
            if q.get('closing_note'):
                cn = R.render(q['closing_note'], ctx)
                if cn:
                    o['cn'] = S.add(cn)
            node['o'].append(o)
        nodes[p] = node
    tree = {'schema': 'flq.defi-rl.tree.v1', 'id': J['id'], 'slug': slug, 'name': J['display']['name'], 'blurb': J['display']['blurb'],
            'logic': J['logic_ver'], 'text': J['text_ver'], 'status': J['status'], 'draft': True, 'pending': pending,
            'provenance': prov, 'intro': J['intro'], 'plan': J['plan'], 'Q': qmeta, 'S': S.list, 'N': nodes}
    return tree, S


build_batch1_tree = build_tree


def check_future_independence(slug, models, scoring, dana=None):
    """Every rendered string and score must be identical whatever the player answers LATER than the node.
    Builds the whole tree with three different engine paddings and compares the results."""
    trees = [build_tree(slug, models, scoring, {}, pad=p, dana=dana)[0] for p in 'ABC']
    base = json.dumps({k: [trees[0]['S'][i] if isinstance(i, int) and i >= 0 else i for i in []] for k in []})  # noqa (placeholder)
    def flat(t):
        S = t['S']
        out = {}
        for key, node in t['N'].items():
            out[key] = (node['v'], S[node['sit']] if node['sit'] >= 0 else '', tuple((S[a], S[b]) for a, b in node['show']),
                        S[node['note']] if node['note'] >= 0 else '', tuple(S[node[x]] if node.get(x, -1) >= 0 else '' for x in ('w', 'aft', 'tk')),
                        tuple(S[o['cn']] if o.get('cn', -1) >= 0 else '' for o in node['o']),
                        tuple((S[o['t']], o['p'], S[o['f']], S[o['u']] if o.get('u', -1) >= 0 else '') for o in node['o']))
        return out
    f0 = flat(trees[0])
    bad = []
    for t in trees[1:]:
        ft = flat(t)
        bad += [k for k in f0 if f0[k] != ft[k]]
    return sorted(set(bad))


# ---------------------------------------------------------------------------------------------
# Gates G4 (tree/engine score parity), structure validation, logic baseline, runtime + report output
# ---------------------------------------------------------------------------------------------
def walk_points(tree, path, alloc=False):
    tot, picks = 0, []
    for k, ch in enumerate(path):
        key = path[:k] if k < 6 else path[:6] + ('+' if alloc else '')
        node = tree['N'][key]
        o = node['o'][ord(ch) - 65]
        tot += o['p']
        picks.append(o['p'])
    return tot, picks


def gate_parity(trees, models, scoring, dana):
    """G4: for every character and every one of the 2,187 answer paths (Dana also with the Other-cash control), the points summed
    along the exported tree equal the engine's own score."""
    checked, bad = 0, []
    for n in BATCH1:
        for pth in (''.join(x) for x in itertools.product('ABC', repeat=7)):
            sc = scoring.score_path(n, models.CH[n](pth), pth)
            want = [100 if x[0] else 0 for x in sc]
            got_t, got = walk_points(trees[n], pth)
            checked += 1
            if got != want:
                bad.append((n, pth, want, got))
    for alloc in (False, True):
        for pth in (''.join(x) for x in itertools.product('ABC', repeat=7)):
            s = dana.run(pth, alloc, logging=False)
            want = sum(100 for i, k in enumerate(['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']) if pth[i] in s.full[k])
            got_t, _ = walk_points(trees['dana'], pth, alloc)
            checked += 1
            if got_t != want or s.score() != want:
                bad.append(('dana', pth, alloc, want, got_t))
    if bad:
        raise GateFailure('G4 tree/engine parity failed on %d paths, first: %r' % (len(bad), bad[:3]))
    return checked


def logic_hash(tree):
    """identity of everything that decides scoring and node structure -- never the player-facing words"""
    core = {k: [node['v'], [o['p'] for o in node['o']], [bool(o.get('u', -1) >= 0) for o in node['o']]] for k, node in sorted(tree['N'].items())}
    core['Q'] = [[q['id'], q['n'], q['month'], q['opts']] for q in tree['Q']]
    return hashlib.sha256(json.dumps(core, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def validate_structure(tree):
    """stable-ID and shape checks; returns a list of problems"""
    bad = []
    S = tree['S']
    seen = set()
    for q in tree['Q']:
        for o in q['opts']:
            if o in seen:
                bad.append('duplicate option id ' + o)
            seen.add(o)
    qids = [q['id'] for q in tree['Q']]
    if len(qids) != len(set(qids)):
        bad.append('duplicate question ids')
    vars_by_q = {}
    for key, node in tree['N'].items():
        if len(node['o']) != 3:
            bad.append('node %s does not have 3 options' % key)
        m = re.match(r'^defi\.(\w+)\.q(\d)\.var_(\w+)$', node['v'])
        if not m or m.group(1) != tree['slug']:
            bad.append('bad variant id ' + node['v'])
        else:
            vars_by_q.setdefault(int(m.group(2)), set()).add(m.group(3))
        for o in node['o']:
            if o['p'] not in (0, 100):
                bad.append('points not 0/100 at %s' % key)
            for f in ('t', 'f'):
                if not (0 <= o[f] < len(S)):
                    bad.append('bad string index at %s' % key)
    for q in tree['Q']:
        q['vars'] = sorted('defi.%s.q%d.var_%s' % (tree['slug'], q['n'], v) for v in vars_by_q.get(q['n'], []))
    return bad


def write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
    return sha(path)


def main(argv):
    import time, importlib
    release = '--release' in argv
    update_baseline = '--update-baseline' in argv
    t0 = time.time()
    rep = {'gates': {}, 'journeys': {}, 'warnings': [], 'result': 'FAIL', 'runtime': 'NOT WRITTEN', 'mode': 'release' if release else 'local-draft'}
    try:
        models, scoring, dana = load_engines()
        rep['gates']['G1 engine pins'] = 'PASS (%d files)' % len(gate_pins())
        h2, n2 = gate_batch1(models, scoring)
        rep['gates']['G2 Batch 1 regression'] = 'PASS %d lines %s' % (n2, h2)
        h3, n3 = gate_dana(dana)
        rep['gates']['G3 Dana regression'] = 'PASS %d lines %s' % (n3, h3)
        trees, strs, pend = {}, {}, {}
        prov_base = {'engine': {k: PINS[k] for k in PINS}, 'batch1_hash': h2, 'dana_hash': h3, 'exporter': sha(os.path.join(HERE, 'defi_rl_export.py'))}
        for slug in SLUGS:
            dn = dana if slug == 'dana' else None
            v = verify_journey(slug, models, scoring, dana=dn)
            bad = {k: v[k] for k in ('ref_fail', 'assert_fail', 'claim_fail', 'no_case') if v[k]}
            if bad:
                raise GateFailure('G5 workbook verification failed for %s: %r' % (slug, {k: val[:2] for k, val in bad.items()}))
            prov = dict(prov_base, workbook=sha(os.path.join(WORKBOOKS, slug + '.journey.json')))
            tree, S = build_tree(slug, models, scoring, prov, dana=dn)
            fut = check_future_independence(slug, models, scoring, dana=dn)
            if fut:
                raise GateFailure('G6 future-dependence in %s: %r' % (slug, fut[:3]))
            probs = validate_structure(tree)
            lr = letter_refs(S.list)
            if probs or lr:
                raise GateFailure('G7 structure/lint failed for %s: %r %r' % (slug, probs[:3], lr[:3]))
            tree['hash'] = {'logic': logic_hash(tree)}
            trees[slug], strs[slug] = tree, S
            pend[slug] = tree['pending']
            rep['journeys'][slug] = {'logic': tree['logic'], 'text': tree['text'], 'nodes': len(tree['N']), 'strings': len(S.list),
                                     'questions': len(tree['Q']), 'variants': sum(len(q['vars']) for q in tree['Q']),
                                     'cases': v['cases'], 'ref_match': v['ref_match'], 'documented_deviations': len(v['ref_deviation']),
                                     'pending_wording': tree['pending'], 'logic_hash': tree['hash']['logic']}
        rep['gates']['G4 tree/engine parity'] = 'PASS %d paths' % gate_parity(trees, models, scoring, dana)
        rep['gates']['G5 workbook round-trip'] = 'PASS (0 reference, assert, claim or coverage failures)'
        rep['gates']['G6 future independence'] = 'PASS (pads A/B/C identical)'
        rep['gates']['G7 structure and lint'] = 'PASS (stable ids unique, 3 options per node, points 0/100, no letter references)'
        # logic baseline: a text-only patch may not change the logic hash
        bpath = os.path.join(REPORTS, 'logic-baseline.json')
        base = json.load(open(bpath)) if os.path.exists(bpath) else {}
        drift = []
        for slug, t in trees.items():
            b = base.get(slug)
            if b and b['logic'] == t['logic'] and b['hash'] != t['hash']['logic']:
                drift.append(slug)
        if drift:
            raise GateFailure('G8 logic hash changed without a logic-version bump: %r' % drift)
        rep['gates']['G8 logic baseline'] = 'PASS' + (' (baseline created)' if not base else '')
        allpend = sum(len(v) for v in pend.values())
        if release and allpend:
            raise GateFailure('RELEASE blocked: %d wording items are still pending approval: %r' % (allpend, pend))
        # G9 financial-claims verification gate: every claim for a journey (or 'all') must be VERIFIED, WAIVED, or a labeled SIMULATION ASSUMPTION (with sim_basis) to release
        creg_path = os.path.join(APPROVED, 'claims-register.json')
        creg = json.load(open(creg_path))['entries'] if os.path.exists(creg_path) else None
        if creg is None:
            open_claims = {'(register missing)': 1}
        else:
            open_claims = {}
            for slug in trees:
                n = sum(1 for e in creg if e['journey'] in (slug, 'all') and not (e['status'] in ('VERIFIED', 'WAIVED') or (e['status'] == 'SIMULATION ASSUMPTION' and e.get('sim_basis')) or e['status'] == 'NAMING REVIEW — UNASSESSED'))
                if n:
                    open_claims[slug] = n
        rep['gates']['G9 claims register'] = 'PASS (release-ready)' if not open_claims else 'OPEN (draft only): %r' % open_claims
        if release and open_claims:
            raise GateFailure('RELEASE blocked: unverified financial claims remain: %r' % open_claims)
        # G10 Educational Terminology Standard: no invented provider/product names in player-facing workbook text (strict: unreviewed suspects also fail)
        import shutil, subprocess
        node = shutil.which('node')
        if not node:
            raise GateFailure('G10 terminology check could not run: node was not found (the gate is never skipped silently)')
        pr = subprocess.run([node, os.path.join(HERE, 'check-terminology.js'), '--strict', '--only', 'defi-real-life/approved/workbooks'], capture_output=True, text=True, cwd=ROOT)
        if pr.returncode != 0:
            raise GateFailure('G10 Educational Terminology Standard failed:\n' + pr.stdout[-3000:])
        rep['gates']['G10 terminology standard'] = 'PASS (no prohibited or unreviewed suspect names in player-facing workbook text; review aid, not proof)'
        if allpend:
            rep['warnings'].append('%d wording items are pending approval; the build is marked DRAFT and --release is blocked' % allpend)
        # write runtime
        manifest = {'schema': 'flq.defi-rl.manifest.v1', 'draft': True, 'journeys': []}
        for slug, t in trees.items():
            digest = write_json(os.path.join(RUNTIME, slug + '.tree.v1.json'), t)
            manifest['journeys'].append({'slug': slug, 'file': slug + '.tree.v1.json', 'sha256': digest, 'logic': t['logic'], 'text': t['text'],
                                         'nodes': len(t['N']), 'pending': len(t['pending']), 'name': t['name'], 'blurb': t['blurb']})
        write_json(os.path.join(RUNTIME, 'manifest.json'), manifest)
        newbase = dict(base)
        for slug, t in trees.items():
            if update_baseline or slug not in base or base[slug]['logic'] != t['logic']:
                newbase[slug] = {'logic': t['logic'], 'hash': t['hash']['logic']}
        write_json(bpath, newbase)
        rep['runtime'] = 'WRITTEN (%d trees + manifest)' % len(trees)
        rep['result'] = 'PASS'
    except GateFailure as e:
        rep['result'] = 'FAIL'
        rep['failure'] = str(e)
        rep['runtime'] = 'NOT WRITTEN (validation failed; runtime JSON is never generated on failure)'
    rep['seconds'] = round(time.time() - t0, 1)
    os.makedirs(REPORTS, exist_ok=True)
    with open(os.path.join(REPORTS, 'defi-rl-import-report.json'), 'w', encoding='utf-8') as f:
        json.dump(rep, f, indent=1, ensure_ascii=False, sort_keys=True)
    lines = ['# DeFi in Real Life -- export report (%s)' % rep['mode'], '', '**Result: %s**' % rep['result'], '']
    for k, v in rep['gates'].items():
        lines.append('- %s: %s' % (k, v))
    lines += ['', '| Journey | Logic | Text | Questions | Variants | Nodes | Strings | Cases | Pending wording |', '|---|---|---|---|---|---|---|---|---|']
    for s, j in rep['journeys'].items():
        lines.append('| %s | %s | %s | %d | %d | %d | %d | %d | %d |' % (s, j['logic'], j['text'], j['questions'], j['variants'], j['nodes'], j['strings'], j['cases'], len(j['pending_wording'])))
    if rep.get('failure'):
        lines += ['', '**Failure:** ' + rep['failure']]
    lines += ['', 'Warnings: ' + ('; '.join(rep['warnings']) or 'none'), 'Runtime output: ' + rep['runtime']]
    with open(os.path.join(REPORTS, 'defi-rl-import-report.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    print('\n'.join(lines))
    return 0 if rep['result'] == 'PASS' else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
