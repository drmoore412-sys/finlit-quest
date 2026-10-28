#!/usr/bin/env python3
"""FinLit Quest DeFi-in-Real-Life Batch 1 financial models v0.1 DRAFT (not approved). Uses fl_engine.Sim.tx for every balance change."""
import itertools, sys, os, hashlib
from decimal import Decimal as D
from fl_engine import Sim, r, f2, export

# ---------- shared helpers ----------
def pay(s, m, ev, amt, srcs, tag='expense'):
    rem = D(amt)
    for a in srcs:
        t = min(s.b[a], rem)
        if t > 0: s.tx(m, ev, tag, {a: -t}); rem -= t
    if rem > 0:
        if s.b['CARD'] + rem <= s.cardlimit:
            s.tx(m, ev + ' (on credit card)', tag, {'CARD': rem}); s.flags['card'] = 1
        else:
            s.tx(m, ev + ' UNFUNDED', tag, {'UNPAID': rem}); s.tx(m, 'late fee', 'fee', {'UNPAID': D(35)}); s.flags['unpaid'] = 1
def inc(s, m, ev, a, amt, tag='income'): s.tx(m, ev, tag, {a: D(amt)})
def mv(s, m, ev, a, b, amt): 
    t = min(s.b[a], D(amt)); 
    if t > 0: s.tx(m, ev, 'transfer', {a: -t, b: t})
    return t
def sell(s, m, ev, a, dst, frac=1, fee='0.005', flat=0):
    amt = r(s.b[a] * D(frac))
    if amt <= 0: return D(0)
    fe = r(amt * D(fee)) + D(flat)
    s.tx(m, ev, 'transfer', {a: -amt, dst: amt - fe}); s.tx(m, ev + ' fee', 'fee', {dst: -fe}) if False else None
    # fee is a real cost: book as separate expense so transfer stays net-zero
    s.tx(m, ev + ' fee', 'fee', {dst: -fe}) if False else None
    return amt
def sell2(s, m, ev, a, dst, frac=1, fee='0.005', flat=0):
    amt = r(s.b[a] * D(frac))
    if amt <= 0: return D(0)
    fe = min(amt, r(amt * D(fee)) + D(flat))
    s.tx(m, ev, 'transfer', {a: -amt, dst: +amt})
    s.tx(m, ev + ' fee', 'fee', {dst: -fe})
    return amt - fe
def repay_card(s, m, srcs, keep=0):
    for a in srcs:
        t = min(s.b['CARD'], max(D(0), s.b[a] - D(keep)))
        if t > 0: s.tx(m, 'repay credit card', 'transfer', {a: -t, 'CARD': -t})
def month_end_card(s, m):
    if s.b['CARD'] > 0: s.tx(m, 'card interest 2%/mo', 'interest', {'CARD': r(s.b['CARD'] * D('0.02'))})
def liq(s, accts): return sum(s.b[a] for a in accts)
def track(s, accts):
    v = liq(s, accts); s.flags['minliq'] = min(s.flags.get('minliq', v), v)
def finish(s):
    chk = s.nw() - s.open_nw - sum(s.cum.values())
    assert chk == 0, ('NW does not reconcile to flows', chk)
    return s
def new(name, assets, liabs, opening, cardlimit=800):
    s = Sim(name, assets + [], liabs + ['CARD', 'UNPAID'], opening); s.cardlimit = D(cardlimit); s.flags = {}; s.decs = {}; return s
def dec(s, k, m, **extra):
    st = {a: s.b[a] for a in s.b}; st['m'] = m
    st['cumETH'] = sum(D(x[5]) for x in s.log if x[4] == 'ETH' and x[3] == 'transfer' and D(x[5]) > 0)
    st.update(extra); s.decs[k] = st

# ---------- ZOE (12 months) ----------
ZINC = {1: 1600, 2: 1600, 3: 1600, 4: 1600, 5: 1300, 6: 1300, 7: 1300, 8: 1300, 9: 1300, 10: 1300, 11: 3700, 12: 1600}
ZEXP = {1: 1500, 2: 1500, 3: 1500, 4: 1500, 5: 1400, 6: 1400, 7: 1400, 8: 1400, 9: 1400, 10: 1400, 11: 1400, 12: 1500}
ZETH = {1: 100, 2: 65, 3: 70, 6: 80, 9: 75, 12: 90}
def zoe(p):
    s = new('zoe', ['CHK', 'SAV', 'TUI', 'VAULT', 'ETH', 'STK', 'DEPHELD'], ['PLAN', 'DEPOWED'], {'CHK': 600, 'SAV': 700, 'TUI': 300}, 800)
    L = ['CHK', 'SAV', 'TUI']
    for m in range(1, 13):
        if m in ZETH: s.reprice(m, ZETH[m], [('ETH', 1)])
        if m == 9 and s.b['STK'] > 0: mv(s, m, 'staking lock ends', 'STK', 'CHK', s.b['STK'])
        inc(s, m, 'paycheck', 'CHK', ZINC[m] - (2400 if m == 11 else 0))
        if m == 11: inc(s, m, 'summer paycheck', 'CHK', 2400)
        pay(s, m, 'monthly bills', ZEXP[m], ['CHK', 'SAV', 'TUI'])
        d = p
        for k_, mm_ in ((0,1),(1,2),(2,3),(3,5),(4,7),(5,8)):
            if m == mm_: dec(s, k_, m)
        if m == 1:
            if d[0] == 'B': s.buy(m, 'D1 vault $300', 300, ['SAV'], 'VAULT')
            if d[0] == 'C': s.buy(m, 'D1 vault $400', 400, ['SAV'], 'VAULT'); s.buy(m, 'D1 ETH $300', 300, ['SAV'], 'ETH')
        if m == 2:
            if d[1] == 'B' and s.b['ETH'] <= 0: s.decline(m, 'D2 sell ETH', 'no ETH owned')
            elif d[1] == 'B': sell2(s, m, 'D2 sell ETH', 'ETH', 'SAV')
            if d[1] == 'C': s.buy(m, 'D2 buy dip ETH $100', 100, ['CHK'], 'ETH')
        if m == 3:
            if d[2] == 'B': pay(s, m, 'D3 scam "processing fee"', 40, ['CHK', 'SAV'], 'loss')
            if d[2] == 'C':
                if s.b['ETH'] > 0: s.tx(m, 'D3 wallet drained (ETH)', 'loss', {'ETH': -s.b['ETH']})
                else: pay(s, m, 'D3 wallet drained (cash)', 120, ['CHK', 'SAV'], 'loss')
        if m == 5:
            if d[3] == 'B': s.buy(m, 'D4 vault $200', 200, ['CHK', 'SAV'], 'VAULT')
            if d[3] == 'C': s.buy(m, 'D4 lock-up stake $600 (locked to M9)', 600, ['SAV', 'CHK', 'TUI'], 'STK')
        if m == 7:
            if d[4] == 'B': s.buy(m, 'D5 learn $30', 30, ['CHK'], 'ETH')
            if d[4] == 'C': s.buy(m, 'D5 learn $150', 150, ['CHK', 'SAV'], 'ETH')
        if m == 8:
            if d[5] == 'C':
                if s.b['ETH'] <= 0 and s.b['VAULT'] <= 0: s.decline(m, 'D6 sell crypto to pay deposit', 'no sellable crypto owned (a locked stake cannot be sold)')
                for a in ('ETH', 'VAULT'):
                    if s.b[a] > 0: sell2(s, m, 'D6 sell ' + a + ' to pay deposit (0.5% + on-chain $19 fee; ASSUMED to settle within the month, before the due date; tax effect NOT modeled)', a, 'CHK', 1, '0.005', 19)
            if d[5] == 'B' and liq(s, L) >= 750:
                # FICTIONAL ASSUMPTION: the landlord accepts a request to split when at least 50% ($750) is paid now; $750 due M10; $25 fee
                pay(s, m, 'D6 deposit/books part 1 (split request ACCEPTED by assumption)', 750, L); s.tx(m, 'D6 deposit/books part 2 owed (due M10)', 'expense', {'DEPOWED': D(750)}); pay(s, m, 'landlord split fee', 25, L, 'fee')
            else:
                if d[5] == 'B': s.decline(m, 'D6 landlord split request', 'REFUSED by assumption: first payment under $750; pay what you can, remainder on card or late')
                pay(s, m, 'D6 deposit+books $1,500' + (' (bank cash $%s is below $1,500: any shortfall below goes on the card/unpaid and is NOT a bank payment)' % f2(liq(s, L)) if (d[5] == 'A' and liq(s, L) < 1500) else ''), 1500, L)
        if m == 10 and s.b['DEPOWED'] > 0:
            t = min(s.b['DEPOWED'], liq(s, L)); 
            for a in L:
                x = min(s.b[a], t); 
                if x > 0: s.tx(m, 'pay deposit balance', 'transfer', {a: -x, 'DEPOWED': -x}); t -= x
            rem_ = s.b['DEPOWED']
            if rem_ > 0:      # same convention as every other bill: shortfall goes on the card, then UNPAID + $35 late fee
                if s.b['CARD'] + rem_ <= s.cardlimit: s.tx(m, 'pay deposit balance shortfall (on credit card)', 'transfer', {'CARD': rem_, 'DEPOWED': -rem_}); s.flags['card'] = 1
                else:
                    s.tx(m, 'deposit balance UNFUNDED (unpaid)', 'transfer', {'UNPAID': rem_, 'DEPOWED': -rem_}); s.tx(m, 'late fee', 'fee', {'UNPAID': D(35)}); s.flags['unpaid'] = 1
        if m == 11:
            for lab in ('UNPAID', 'DEPOWED'):
                for a in L:
                    x = min(s.b[a], s.b[lab])
                    if x > 0: s.tx(m, 'settle ' + lab, 'transfer', {a: -x, lab: -x})
            dec(s, 6, m)
            if d[6] == 'A' or d[6] == 'B': repay_card(s, m, L)
            if d[6] == 'B': s.buy(m, 'D7 vault $400', 400, ['CHK'], 'VAULT')
            if d[6] == 'C': s.buy(m, 'D7 ETH $1,000', 1000, ['CHK'], 'ETH')
        if m == 12:
            paid = min(D(1500), liq(s, L)); t = paid
            for a in L:
                x = min(s.b[a], t)
                if x > 0: s.tx(m, 'tuition installment 1', 'expense', {a: -x}); t -= x
            s.tx(m, 'tuition left on school plan', 'expense', {'PLAN': D(4500) - paid})
            pay(s, m, 'plan enrolment fee', 45, L, 'fee')
            if paid < 1500: s.tx(m, 'late fee on installment 1', 'fee', {'PLAN': D(75)})
        if m >= 2 and s.b['VAULT'] > 0: s.tx(m, 'vault yield 0.5%/mo (variable, not guaranteed)', 'yield', {'VAULT': r(s.b['VAULT'] * D('0.005'))})
        if s.b['STK'] > 0: s.tx(m, 'stake yield 0.5%/mo', 'yield', {'STK': r(s.b['STK'] * D('0.005'))})
        month_end_card(s, m); track(s, L); s.snap(m, 'end')
    return finish(s)

# ---------- MAYA (14 months) ----------
MI = {4: 100, 5: 105, 6: 95, 9: 100, 12: 110, 13: 77, 14: 80}
def maya(p):
    s = new('maya', ['CHK', 'SAV', 'VAULT', 'ETH', 'RET'], [], {'CHK': 500, 'SAV': 1000, 'RET': 2200}, 1500)
    L = ['CHK', 'SAV']; pct = D(0); GROSS = D(3800)
    for m in range(1, 15):
        if m in MI: s.reprice(m, MI[m], [('ETH', 1)])
        inc(s, m, 'take-home pay (net of tax, BEFORE retirement contribution)', 'CHK', 2900)
        if m == 2: dec(s, 1, m)
        if m == 2: pct = {'A': D('0.04'), 'B': D('0.02'), 'C': D(0)}[p[1]]
        if m >= 2 and pct > 0:
            contrib = r(GROSS * pct); cash = r(contrib * D('0.85')); match = r(GROSS * min(pct, D('0.04')))
            s.tx(m, '401k: pre-tax contrib + employer match, cash cost after assumed 15% tax saving', 'retire', {'CHK': -cash, 'RET': contrib + match})
        pay(s, m, 'monthly living costs', 2350, L)
        for k_, mm_ in ((0,1),(2,4),(3,5),(4,8),(5,11),(6,13)):
            if m == mm_: dec(s, k_, m)
        if m == 1:
            if p[0] == 'B': s.buy(m, 'D1 vault $300', 300, ['SAV'], 'VAULT')
            if p[0] == 'C': s.buy(m, 'D1 vault $1,000', 1000, ['SAV'], 'VAULT')
        if m == 4:
            if p[2] == 'A': s.buy(m, 'D3 ETH $150 (offline backup)', 150, ['CHK', 'SAV'], 'ETH')
            if p[2] == 'C': s.buy(m, 'D3 ETH $500', 500, ['CHK', 'SAV'], 'ETH')
        if m == 5:
            if p[3] in 'BC' and s.b['ETH'] > 0: s.tx(m, 'D4 airdrop phishing: wallet drained', 'loss', {'ETH': -s.b['ETH']})
            if p[3] == 'C': pay(s, m, 'D4 "gas" paid to scammer', 60, L, 'loss')
        if m == 6: pay(s, m, 'car repair', 1500, L)
        if m == 8:
            s.tx(m, 'stablecoin trades at $0.92', 'market', {'VAULT': r(s.b['VAULT'] * D('0.92')) - s.b['VAULT']}) if s.b['VAULT'] > 0 else None
            if p[4] == 'B' and s.b['VAULT'] <= 0: s.decline(m, 'D5 sell vault', 'no vault position owned')
            elif p[4] == 'B': sell2(s, m, 'D5 sell vault at 0.92', 'VAULT', 'CHK')
        if m == 9:
            if p[4] == 'C': s.tx(m, 'laptop financed on credit card', 'expense', {'CARD': D(900)}); s.flags['card'] = 1
            else: pay(s, m, 'laptop', 900, L)
        if m == 10 and s.b['VAULT'] > 0: s.tx(m, 'partial recovery to 0.98', 'market', {'VAULT': r(s.b['VAULT'] * (D('0.98') / D('0.92'))) - s.b['VAULT']})
        if m == 11:
            if p[5] == 'B':
                if liq(s, L) - 200 >= 3300: s.buy(m, 'D6 gated $200 ETH', 200, L, 'ETH')
                else: s.decline(m, 'D6 gated $200 ETH', 'gate: reserve must stay >= $3,300 after the $200')
            if p[5] == 'C': s.buy(m, 'D6 ETH $500 (gate ignored)', 500, L, 'ETH')
        if m == 13:
            if p[6] == 'B': s.buy(m, 'D7 ETH $200', 200, L, 'ETH')
            if p[6] == 'C': s.buy(m, 'D7 ETH $400', 400, L, 'ETH')
        if m >= 2 and s.b['VAULT'] > 0: s.tx(m, 'vault yield 0.5%/mo (variable)', 'yield', {'VAULT': r(s.b['VAULT'] * D('0.005'))})
        repay_card(s, m, ['CHK'], keep=0) if m >= 10 else None
        if s.b['CHK'] > 500: mv(s, m, 'sweep to emergency savings', 'CHK', 'SAV', s.b['CHK'] - 500)
        month_end_card(s, m); track(s, L); s.snap(m, 'end')
    return finish(s)

# ---------- JULES (14 months) ----------
JI = {1: 100, 3: 100, 5: 100, 7: 60, 9: 70, 12: 75, 13: 95, 14: 105}
DIG = ['VAULT', 'POOL', 'ETH']
def base(s): return sum(s.b[a] for a in ['IDX', 'RET'] + DIG)
def dig(s): return sum(s.b[a] for a in DIG)
def dbuy(s, m, ev, a, amt):
    amt = D(amt); b = base(s)
    if s.b[a] + amt > r(b * D('0.05')): s.decline(m, ev, 'per-position cap 5%% of base (%s) exceeded' % f2(r(b * D('0.05')))); return False
    if dig(s) + amt > r(b * D('0.10')): s.decline(m, ev, 'total digital cap 10%% of base (%s) exceeded' % f2(r(b * D('0.10')))); return False
    return s.buy(m, ev, amt, ['CHK', 'IDX'], a)
def jules(p, synth=None):
    s = new('jules', ['CHK', 'RES', 'IDX', 'RET', 'VAULT', 'POOL', 'ETH'], ['KLP'], {'CHK': 1200, 'RES': 5600, 'IDX': 20000, 'RET': 30000}, 2000)
    loan = False; drain = False
    for m in range(1, 15):
        if m in JI: s.reprice(m, JI[m], [('ETH', 1)])
        inc(s, m, 'net pay', 'CHK', 3700); pay(s, m, 'living costs', 2800, ['CHK', 'RES'])
        for a in ('IDX', 'RET'): s.tx(m, a + ' market return 0.5%/mo (assumption)', 'market', {a: r(s.b[a] * D('0.005'))})
        if synth and m == synth.get('month') and s.b['CHK'] > D(synth['chk']):
            pay(s, m, 'SYNTHETIC TEST STATE: unmodeled cash outflow (not part of the 2,187 real paths)', s.b['CHK'] - D(synth['chk']), ['CHK'], 'expense')
        for k_, mm_ in ((0,1),(1,3),(2,5),(3,7),(4,9),(6,13)):
            if m == mm_: dec(s, k_, m, base=base(s), dig=dig(s))
        if m == 1:
            if p[0] == 'B': dbuy(s, m, 'D1 Harbor Vault $1,000', 'VAULT', 1000)
            if p[0] == 'C': dbuy(s, m, 'D1 Harbor Vault $2,500', 'VAULT', 2500)
        if m == 3:
            if p[1] in 'BC': dbuy(s, m, 'D2 Surge Pool $1,000', 'POOL', 1000)
            if p[1] == 'C': dbuy(s, m, 'D2 ETH $%s' % f2(synth['eth'] if synth and 'eth' in synth else 2500), 'ETH', synth['eth'] if synth and 'eth' in synth else 2500)
        if m == 5:
            if p[2] == 'B':
                if s.b['ETH'] >= 2000: s.tx(m, 'D3 Keystone loan $1,000 vs ETH (50% max LTV)', 'transfer', {'KLP': D(1000), 'CHK': D(1000)}); 
                else: s.decline(m, 'D3 Keystone loan $1,000', 'ETH collateral %s < $2,000 needed at 50%% max LTV' % f2(s.b['ETH']))
            if p[2] == 'C':
                if s.b['ETH'] <= 0 and s.b['VAULT'] <= 0: s.decline(m, 'D3 sell crypto for premium', 'no ETH or vault position owned')
                need = D(1100)
                for a in ('ETH', 'VAULT'):
                    if need > 0 and s.b[a] > 0: g = sell2(s, m, 'D3 sell ' + a + ' for premium', a, 'CHK', min(D(1), r(need / s.b[a]))); need -= g
            pay(s, m, 'insurance premium $1,100', 1100, ['CHK', 'RES']);
            if s.b['RES'] < 5600: s.flags['reserve_breach'] = 1
        if m == 7 and s.b['KLP'] > 0:
            if p[3] == 'A': t = min(s.b['KLP'], s.b['CHK']); s.tx(m, 'D4 repay loan', 'transfer', {'CHK': -t, 'KLP': -t})
            if p[3] == 'B': dbuy(s, m, 'D4 add collateral $500', 'ETH', 500)
        if m == 7 and s.b['KLP'] == 0:
            if p[3] == 'B' and s.b['ETH'] <= 0: s.decline(m, 'D4 trim ETH', 'no ETH owned')
            elif p[3] == 'B': sell2(s, m, 'D4 trim ETH 50%', 'ETH', 'CHK', D('0.5'))
            if p[3] == 'C': dbuy(s, m, 'D4 buy dip ETH $1,000', 'ETH', 1000)
        if m == 9:
            if p[4] == 'B' and s.b['POOL'] <= 0: s.decline(m, 'D5 vote', 'no governance power: no pool position')
            elif p[4] == 'B': pay(s, m, 'D5 vote gas', 8, ['CHK'], 'fee')
            if p[4] == 'C': drain = True
        if m == 10 and drain and s.b['POOL'] > 0: s.tx(m, 'D5 unlimited allowance drained 25% of pool', 'loss', {'POOL': -r(s.b['POOL'] * D('0.25'))})
        if m == 11:
            if s.b['VAULT'] > 0: s.tx(m, 'EXPLOIT: Harbor Vault position loses 35%', 'loss', {'VAULT': -r(s.b['VAULT'] * D('0.35'))})
            dec(s, 5, m, base=base(s), dig=dig(s))
            if p[5] == 'A' and s.b['VAULT'] <= 0: s.decline(m, 'D6 withdraw vault', 'no vault position owned')
            elif p[5] == 'A': sell2(s, m, 'D6 withdraw remaining vault', 'VAULT', 'CHK')
            if p[5] == 'C': dbuy(s, m, 'D6 add $500 to damaged vault', 'VAULT', 500)
        if m == 12 and p[5] == 'C' and s.b['VAULT'] > 0 and s.flags.get('added'): pass
        if m == 12 and p[5] == 'C': s.tx(m, 'D6 vault insolvent: new deposit lost', 'loss', {'VAULT': -min(s.b['VAULT'], D(500))}) if s.b['VAULT'] >= 500 else None
        if m == 13:
            if p[5] == 'B': pass
            if p[6] == 'A' and dig(s) <= r(base(s) * D('0.08')): s.decline(m, 'D7 rebalance sale', 'digital exposure already at or under 8%: nothing to sell')
            if p[6] == 'A' and dig(s) > r(base(s) * D('0.08')):
                ex = dig(s) - r(base(s) * D('0.08'))
                for a in ('ETH', 'POOL', 'VAULT'):
                    t = min(ex, s.b[a])
                    if t > 0: sell2(s, m, 'D7 rebalance sell ' + a, a, 'CHK', min(D(1), t / s.b[a])); ex -= t
            if p[6] == 'C': dbuy(s, m, 'D7 ETH $2,000', 'ETH', 2000)
        if m == 13 and p[5] == 'B' and s.b['VAULT'] > 0: s.tx(m, 'recovery payout (ASSUMED 20% of loss)', 'income', {'VAULT': D(0)})
        if s.b['VAULT'] > 0: s.tx(m, 'vault yield 0.4%/mo', 'yield', {'VAULT': r(s.b['VAULT'] * D('0.004'))})
        if s.b['POOL'] > 0: s.tx(m, 'pool fees 0.8%/mo (variable)', 'yield', {'POOL': r(s.b['POOL'] * D('0.008'))})
        if s.b['KLP'] > 0: s.tx(m, 'Keystone interest 0.75%/mo', 'interest', {'KLP': r(s.b['KLP'] * D('0.0075'))})
        if s.b['KLP'] > 0 and s.b['ETH'] > 0 and s.b['KLP'] / s.b['ETH'] > D('0.80'):
            owed = s.b['KLP']; seize = min(s.b['ETH'], r(owed * D('1.05')))
            s.tx(m, 'FORCED SALE at LTV>80%', 'liquidation', {'ETH': -seize, 'KLP': -owed}); s.flags['liquidated'] = 1
        if s.b['CHK'] > 2000: mv(s, m, 'sweep to index fund', 'CHK', 'IDX', s.b['CHK'] - 2000)
        if s.b['RES'] < 5600 and s.b['CHK'] > 2000: pass
        track(s, ['CHK', 'RES']); s.flags['digpct'] = dig(s) / base(s); s.snap(m, 'end')
    return finish(s)

# ---------- MARCUS (13 months) ----------
MFIAT = {1: 3100, 6: 2400, 8: 8800}
MEI = {5: 100, 7: 85}
def marcus(p):
    s = new('marcus', ['BIZ', 'PER', 'EMER', 'TAX', 'USDC', 'VAULT', 'ETH', 'TAXV'], [], {'BIZ': 2400, 'PER': 900, 'EMER': 2600}, 1500)
    acc = {}; cleanup = False
    for m in range(1, 14):
        if m in MEI: s.reprice(m, MEI[m], [('ETH', 1)])
        fiat = D(MFIAT.get(m, 5600)) if m <= 12 else D(5600); inc(s, m, 'client receipts (USD)', 'BIZ', fiat); recog = fiat
        if m == 1:
            inc(s, m, 'USDC invoice $2,500 received (fair value)', 'USDC', 2500); recog += 2500
            if p[0] == 'A': sell2(s, m, 'D1 convert USDC (1%)', 'USDC', 'BIZ', 1, '0.01')
            if p[0] == 'B': sell2(s, m, 'D1 convert half USDC (1%)', 'USDC', 'BIZ', D('0.5'), '0.01')
        pay(s, m, 'business operating expenses', 1500, ['BIZ'])
        profit = recog - 1500; res = r(profit * D('0.20')) if profit > 0 else D(0); acc[m] = res
        mv(s, m, 'tax reserve 20% of net receipts (ASSUMED rate)', 'BIZ', 'TAX', res)
        for k_, mm_ in ((0,1),(1,3),(2,5),(3,6),(4,8),(5,10)):
            if m == mm_: dec(s, k_, m)
        if m in (4, 7, 10, 13):
            if m == 7 and p[2] in 'BC':
                a = 'TAXV' if p[2] == 'B' else 'ETH'
                if s.b[a] > 0: sell2(s, m, 'D3 return reserve funds before due date', a, 'TAX')
            due = sum(acc.get(k, 0) for k in range(m - 3, m))
            pay(s, m, 'estimated tax payment (ASSUMED schedule)', due, ['TAX', 'BIZ', 'EMER'], 'tax')
        if m == 3:
            if p[1] == 'B': s.buy(m, 'D2 vault $1,000 from runway', 1000, ['EMER'], 'VAULT')
            if p[1] == 'C': s.buy(m, 'D2 vault $2,000 from runway', 2000, ['EMER'], 'VAULT')
        if m == 5:
            if p[2] == 'B': s.buy(m, 'D3 tax reserve to vault $1,000', 1000, ['TAX'], 'TAXV')
            if p[2] == 'C': s.buy(m, 'D3 tax reserve to ETH $1,500', 1500, ['TAX'], 'ETH')
        d = min(D(3000), s.b['BIZ']); mv(s, m, 'owner draw', 'BIZ', 'PER', d)
        if m in (6, 7):
            spend = D(2200) if p[3] == 'B' else D(3000)
            pay(s, m, 'personal spending', spend, ['PER', 'EMER'] if p[3] != 'C' else ['PER'])
        else: pay(s, m, 'personal spending', 3000, ['PER', 'EMER'])
        if m == 8:
            if p[4] == 'B': pay(s, m, 'D5 scam "verification" fee', 45, ['PER', 'EMER'], 'loss')
            if p[4] == 'C':
                for a in ('USDC', 'ETH', 'VAULT', 'TAXV'):
                    if s.b[a] > 0: s.tx(m, 'D5 signed message drained ' + a, 'loss', {a: -s.b[a]})
        if m == 9: pay(s, m, 'work laptop replacement $2,200', 2200, ['BIZ', 'EMER'])
        if m == 10:
            if p[5] == 'A' and s.b['USDC'] > 0: sell2(s, m, 'D6 convert remaining USDC (1%)', 'USDC', 'BIZ', 1, '0.01')
            if p[5] == 'B' and s.b['USDC'] > 0: sell2(s, m, 'D6 convert half USDC (1%)', 'USDC', 'BIZ', D('0.5'), '0.01')
            if p[5] == 'B' and s.b['USDC'] <= 0: s.seq += 1; s.log.append((s.seq, m, 'D6 (no USDC held) records kept AND invoice terms changed: future crypto invoices paid in USD or converted same day (no ledger effect; benefit not modeled)', 'note', '-', '0.00', '0.00'))
            if p[5] == 'C': cleanup = True
        if m == 12:
            if s.b['VAULT'] > 0: s.tx(m, 'EXPLOIT: experimental vault loses 50%', 'loss', {'VAULT': -r(s.b['VAULT'] * D('0.5'))})
            dec(s, 6, m)
            if p[6] == 'A' and s.b['VAULT'] <= 0 and s.b['BIZ'] <= 1500: s.decline(m, 'D7 withdraw/rebuild', 'no vault owned and no business cash above 1,500 to move')
            if p[6] == 'A':
                if s.b['VAULT'] > 0: sell2(s, m, 'D7 withdraw remaining vault', 'VAULT', 'EMER')
                if s.b['BIZ'] > 1500: mv(s, m, 'D7 rebuild personal emergency fund', 'BIZ', 'EMER', s.b['BIZ'] - 1500)
            if p[6] == 'C':
                if s.b['BIZ'] + s.b['EMER'] >= 500 + 1500: s.buy(m, 'D7 chase loss $500', 500, ['BIZ', 'EMER'], 'VAULT')
                else: s.decline(m, 'D7 chase loss $500', 'would leave operating+emergency cash under $1,500')
            if cleanup: pay(s, m, 'accountant clean-up of unrecorded crypto (ASSUMED $300)', 300, ['BIZ', 'EMER'])
        if m == 13 and p[6] == 'C' and s.b['VAULT'] > 0: s.tx(m, 'D7 second exploit: new deposit lost', 'loss', {'VAULT': -min(s.b['VAULT'], D('497.50'))})
        if s.b['VAULT'] > 0 and m < 12: s.tx(m, 'vault yield 0.4%/mo', 'yield', {'VAULT': r(s.b['VAULT'] * D('0.004'))})
        month_end_card(s, m); track(s, ['BIZ', 'PER', 'EMER']); s.snap(m, 'end')
    return finish(s)

# ---------- ELENA (12 months) ----------
def elena(p):
    s = new('elena', ['CHK', 'RES', 'VAULT', 'ETH', 'DEPHELD'], ['MED'], {'CHK': 1000, 'RES': 6300}, 3000)
    L = ['CHK', 'RES']
    for m in range(1, 13):
        if m == 8 and s.b['VAULT'] > 0: s.tx(m, 'stablecoin trades at $0.85', 'market', {'VAULT': r(s.b['VAULT'] * D('0.85')) - s.b['VAULT']})
        if m == 10 and s.b['VAULT'] > 0: s.tx(m, 'partial recovery to $0.88 (no full recovery assumed)', 'market', {'VAULT': r(s.b['VAULT'] * (D('0.88') / D('0.85'))) - s.b['VAULT']})
        inc(s, m, 'net pay' + (' (75% parental-leave pay)' if m in (2, 3) else ''), 'CHK', 3825 if m in (2, 3) else 5100)
        pay(s, m, 'household costs', 4200, L)
        if m >= 2: pay(s, m, 'baby supplies', 150, L)
        if m >= 7: pay(s, m, 'childcare tuition (+$700/mo)', 700, L)
        for k_, mm_ in ((0,1),(1,2),(2,3),(3,4),(4,6),(5,8),(6,11)):
            if m == mm_: dec(s, k_, m)
        if m == 1:
            if p[0] == 'B': s.buy(m, 'D1 vault $1,500', 1500, ['RES'], 'VAULT')
            if p[0] == 'C': s.buy(m, 'D1 vault $3,000', 3000, ['RES'], 'VAULT')
        if m == 2:
            if p[1] == 'A': pay(s, m, 'D2 medical bill $2,700', 2700, ['CHK', 'RES', 'VAULT'])
            if p[1] == 'B': s.tx(m, 'D2 medical bill on 0% payment plan (ASSUMED)', 'expense', {'MED': D(2700)})
            if p[1] == 'C': s.tx(m, 'D2 medical bill on credit card', 'expense', {'CARD': D(2700)}); s.flags['card'] = 1
        if m >= 3 and s.b['MED'] > 0:
            t = min(D(225), s.b['MED'])
            for a in L:
                x = min(s.b[a], t)
                if x > 0: s.tx(m, 'medical plan instalment', 'transfer', {a: -x, 'MED': -x}); t -= x
        if m == 3:
            inc(s, m, "baby's $100 ETH gift", 'ETH', 100, 'gift')
            if p[2] == 'B': sell2(s, m, 'D3 sell gift ETH to savings', 'ETH', 'RES')
            if p[2] == 'C': s.buy(m, 'D3 add ETH $400', 400, L, 'ETH')
        if m == 4 and p[3] == 'C': s.buy(m, 'D4 add ETH $300 (phrase still synced)', 300, L, 'ETH')
        if m == 5 and p[3] in 'BC' and s.b['ETH'] > 0: s.tx(m, 'D4 synced phrase: wallet drained (scenario)', 'loss', {'ETH': -s.b['ETH']})
        if m == 6:
            if p[4] == 'B' and s.b['ETH'] < 2000: s.decline(m, 'D5 Keystone loan $1,000', 'ETH collateral %s < $2,000 needed' % f2(s.b['ETH']))
            if p[4] == 'C': s.tx(m, 'D5 childcare deposit on credit card (refundable, held as asset)', 'transfer', {'CARD': D(1800), 'DEPHELD': D(1800)}); s.flags['card'] = 1
            else:
                need = D(1800)
                for a in L:
                    x = min(s.b[a], need)
                    if x > 0: s.tx(m, 'D5 childcare deposit (refundable, held as asset)', 'transfer', {a: -x, 'DEPHELD': x}); need -= x
                if need > 0: s.decline(m, 'childcare deposit remainder', 'short %s' % f2(need)); s.flags['unpaid'] = 1
        if m == 8:
            if p[5] == 'B' and s.b['VAULT'] <= 0: s.decline(m, 'D6 sell vault', 'no vault position owned')
            elif p[5] == 'B': sell2(s, m, 'D6 sell vault at 0.85', 'VAULT', 'RES')
            if p[5] == 'C': s.buy(m, 'D6 add $500 at 0.85', 500, L, 'VAULT')
        if m == 11:
            if p[6] == 'B':
                if liq(s, L) >= 6300 + 50: s.buy(m, 'D7 gated $50 ETH', 50, L, 'ETH')
                else: s.decline(m, 'D7 gated $50', 'gate: reserve must be back at $6,300 target')
            if p[6] == 'C': s.buy(m, 'D7 ETH $300 (gate ignored)', 300, L, 'ETH')
        if m >= 2 and s.b['VAULT'] > 0 and m != 8: s.tx(m, 'vault yield 0.4%/mo', 'yield', {'VAULT': r(s.b['VAULT'] * D('0.004'))})
        repay_card(s, m, ['CHK'], keep=1000)
        if s.b['CHK'] > 1500: mv(s, m, 'sweep to reserve', 'CHK', 'RES', s.b['CHK'] - 1500)
        month_end_card(s, m); track(s, L); s.snap(m, 'end')
    return finish(s)

CH = {'zoe': zoe, 'maya': maya, 'jules': jules, 'marcus': marcus, 'elena': elena}
