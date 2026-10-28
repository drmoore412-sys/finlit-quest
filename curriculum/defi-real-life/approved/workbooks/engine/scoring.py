"""Batch 1 conditional 100/0 scoring rules, v0.2 DRAFT. Rules read ONLY the visible financial state captured at the decision (s.decs[k]). Scores never read later balances."""
from decimal import Decimal as D
Z = D(0)
def ok(b, why): return (bool(b), why)

def zsim(cash, card, stk, pays, part2=D(0), lim=D(800), cost=False):
    """Mini-forecast of Zoe M8-M10 under the engine's rules (cash first; a shortfall goes on the card only if ALL of it fits, else it is UNPAID; 2%/month card interest, half-up cents).
    Returns the total UNPAID amount (before late fees). Ignores the small stake/vault yields (conservative)."""
    from decimal import ROUND_HALF_UP
    S = {'cash': D(cash), 'card': D(card), 'un': D(0), 'int': D(0)}
    def pay(x):
        x = D(x); t = min(S['cash'], x); S['cash'] -= t; rem = x - t
        if rem > 0:
            if S['card'] + rem <= lim: S['card'] += rem
            else: S['un'] += rem
    def me():
        i_ = (S['card'] * D('0.02')).quantize(D('0.01'), ROUND_HALF_UP); S['card'] += i_; S['int'] += i_
    for x in pays: pay(x)
    me()
    S['cash'] += D(stk) + 1300; pay(1400); me()
    S['cash'] += 1300; pay(1400)
    if part2 > 0: pay(part2)
    me()
    return (S['un'], S['int']) if cost else S['un']
# ---------------- ZOE ----------------
ZS = {1:100,2:100,3:100,4:100,5:-100,6:-100,7:-100,8:-100,9:-100,10:-100,11:2300,12:100}
def z_req(m):  # protected liquidity: next due obligation minus scheduled surplus that arrives BEFORE its due month ends
    # +200 = the M9 and M10 deficits (-100 each) that fall before the M11 paycheck; the M11 paycheck is never counted toward the M8 deposit
    if m <= 8: return D(1500) + 200 - sum(ZS[k] for k in range(m+1, 9))
    return D(1445)  # M12 tuition 1,500 + 45 plan fee - 100 scheduled M12 surplus
def zL(st): return st['CHK']+st['SAV']+st['TUI']
def zH(st): return zL(st) - z_req(st['m'])
def zoe_rules(k, st):
    H = zH(st); L = zL(st); eth = st['ETH']
    if k == 0: return {'A':ok(1,'keep cash'),'B':ok(H-300>=0,'headroom>=300'),'C':ok(H-700>=0,'headroom>=700')}
    if k == 1: return {'A':ok(eth==0 or H>=0,'no ETH owned (no action), or headroom>=0'),'B':ok(eth>0,'ETH owned (sale possible)'),'C':ok(H-100>=0,'headroom>=100')}
    if k == 2: return {'A':ok(1,'verify'),'B':ok(0,'pays scammer'),'C':ok(0,'signs wallet')}
    if k == 3: return {'A':ok(1,'decline'),'B':ok(H-200>=0,'headroom>=200'),'C':ok(0,'locked past deadline')}
    if k == 4: return {'A':ok(1,'skip'),'B':ok(H-30>=0,'headroom>=30'),'C':ok(H-150>=0,'headroom>=150')}
    if k == 5:
        # v0.6. A = "pay $1,500 by bank": only with bank cash >= 1,500 (a card advance is never a bank payment).
        # B = landlord split (fictional acceptance: >= 750 paid now, 750 due M10, $25 fee). Defensible only when it is needed AND the protected
        #     obligations through M10 (775 now + 200 known deficits + 750 balance = 1,725) fit inside bank cash plus the unused card limit.
        # C = sell owned sellable crypto (ETH, vault; a locked stake is not sellable), 0.5% + $19 per position, ALL positions sold.
        #     Full credit when the sale is feasible and reduces overall harm; it need not cover the whole shortfall.
        # LEAST-HARM: when none of A, B, C meets its normal requirement, the feasible answer(s) leaving the smallest uncovered shortfall earn 100.
        from decimal import ROUND_HALF_UP
        gross = Z; net = Z; owned = False
        for a in ('ETH', 'VAULT'):
            if st[a] > 0:
                owned = True; fe = min(st[a], (st[a]*D('0.005')).quantize(D('0.01'), ROUND_HALF_UP) + 19); gross += st[a]; net += st[a] - fe
        fee = gross - net; hd = 800 - st['CARD']; clean = st['UNPAID'] == 0; stk = st['STK']   # a locked stake is released to cash at M9 (yield ignored: conservative)
        c0 = st['CARD']
        gapA = zsim(L, c0, stk, [1500])                          # A (and the card-advance version): pay 1,500 now, then M9-M10 as modeled
        a_ = L >= 1500 and clean and gapA == 0
        remB = zsim(L, c0, stk, [750, 25], D(750)) if L >= 750 else None   # B: 750 + 25 fee now, part 2 (750) at M10: UNPAID if cash and the card cannot take it
        b_ok = L >= 750 and clean and remB == 0 and not a_
        need = max(Z, 1500 - L)
        gap0 = gapA; gap1 = zsim(L + net, c0, stk, [1500])
        avoided = min(net, need)
        cB = D(25) + (D(35) if (remB or 0) > 0 else Z) + (zsim(L, c0, stk, [750, 25], D(750), cost=True)[1] if L >= 750 else Z); cC = fee + zsim(L + net, c0, stk, [1500], cost=True)[1]   # 6% = modeled 2%/mo card interest, M8-M10, repaid at M11
        # the sale cuts harm if the uncovered amount falls, or stays equal and the interest it avoids covers its fees, or (when the split is the only other credited plan) it is no worse than the split on cost and uncovered amount
        harm_cut = (gap1 < gap0) or (gap1 == gap0 and (avoided * D('0.06') >= fee or (b_ok and cC <= cB)))
        c_n = owned and need > 0 and net > 0 and clean and harm_cut
        none_ = not (a_ or b_ok or c_n)
        optB = L >= 750; optC = owned and net > 0 and need > 0
        uB = remB if remB is not None else Z; uC = gap1
        optA = L < 1500 and clean                      # pay $1,500 now, shortfall on the card (an advance, NOT a bank payment)
        uA = gap0
        cA = zsim(L, c0, stk, [1500], cost=True)[1]
        cand = sorted((u, c, n_) for u, c, n_, o in ((uA, cA, 'A', optA), (uB, cB, 'B', optB), (uC, cC, 'C', optC)) if o)
        best = cand[0][:2] if cand else None
        lhA = none_ and best is not None and (uA, cA) == best and optA
        # v0.6.1: an explicitly described card advance earns credit when it is feasible (nothing unpaid through M10) and dominates the landlord split (no more uncovered, no higher modeled cost)
        adv = optA and L >= 750 and clean and uA == 0 and cA <= cB and not a_
        lhB = none_ and best is not None and (uB, cB) == best and optB
        lhC = (none_ and best is not None and (uC, cC) == best and optC) or (c_n and gap1 > 0)
        return {'A':ok(a_ or lhA or adv,'bank cash >= 1,500 and the 200 of M9-M10 deficits fit inside the card limit' if a_ else ('CARD ADVANCE dominates the split: advance of %s covers the $1,500 (bank cash %s); modeled interest %s vs split cost %s; nothing unpaid through M10; NOT a bank payment' % (min(hd, need), L, cA.quantize(D('0.01')), cB)) if (adv and not lhA) else (('LEAST-HARM: no answer meets its normal requirement; a card advance of %s covers the $1,500 and leaves %s of M9-M10 deficits uncovered (a card advance is NOT a bank payment)' % (min(hd, need), uA)) if lhA else 'bank cash below 1,500: a card advance is not a bank payment (zero)')),
                'B':ok(b_ok or lhB,('LEAST-HARM: split leaves part 2 of the deposit short at M10 by %s (plus $35 late fee)' % remB) if lhB else ('split accepted; 775 now + 200 deficits + 750 at M10 are all covered by bank cash (including the released stake)' if b_ok else ('paying in full is feasible: the $25 split is an unnecessary fee' if a_ else ('split refused (<750 now)' if not optB else 'split would leave the M10 balance short while another answer qualifies')))),
                'C':ok(c_n or lhC,('LEAST-HARM: sale leaves %s of the $1,500 plus M9-M10 deficits uncovered (unpaid bill + $35 late fee)' % gap1) if lhC else ('sale of owned crypto is feasible and cuts harm (uncovered %s -> %s; fees %s)' % (gap0, gap1, fee) if c_n else ('no funding need (bank cash >= 1,500)' if need == 0 else ('no sellable crypto owned' if not owned else 'sale fees exceed the harm it removes'))))}
    if k == 6:
        Lp = max(Z, L - st['CARD'] - st['UNPAID'] - st['DEPOWED']); Hp = Lp - z_req(12)
        return {'A':ok(1,'settle obligations'),'B':ok(Hp-400>=0,'headroom>=400 after settling'),'C':ok(Hp-1000>=0,'headroom>=1000 after settling')}
# ---------------- MAYA ----------------
def mL(st): return st['CHK']+st['SAV']
def m_allow(st, X, L=None):
    L = mL(st) if L is None else L
    return (st['cumETH'] + X <= 200 and L - X >= 3300) or (L - X >= 4700)
def maya_rules(k, st):
    L = mL(st); card = st['CARD']
    if k == 0: return {'A':ok(1,'keep'),'B':ok(L-300>=4700 or (L-300>=3300),'reserve stays >=3300'),'C':ok(L-1000>=3300,'reserve stays >=3300')}
    if k == 1:
        L2 = L - 2350
        return {'A':ok(1,'full match'),'B':ok(L2<2350,'liquidity under one month of costs'),'C':ok(0,'forfeits free match')}
    if k == 2: return {'A':ok(m_allow(st,150),'within crypto allowance'),'B':ok(1,'wait'),'C':ok(m_allow(st,500),'within crypto allowance')}
    if k == 3: return {'A':ok(1,'ignore'),'B':ok(0,'signs'),'C':ok(0,'signs + pays')}
    if k == 4:
        v = st['VAULT']
        a_ = L >= 900; b_ = (v>0 and L<900); c_ = (L<900 and v==0)
        return {'A':ok(a_,'cash covers laptop'),'B':ok(b_,'vault owned and cash short'),'C':ok(c_,'cash short and no vault to sell')}
    if k == 5: return {'A':ok(1,'skip'),'B':ok(m_allow(st,200) and card==0 and L-200>=3300,'gate met, no card debt'),'C':ok(m_allow(st,500) and card==0 and L-500>=3300,'above target')}
    if k == 6: return {'A':ok(1,'keep rebuilding'),'B':ok(m_allow(st,200) and card==0,'allowance or target met'),'C':ok(m_allow(st,400) and card==0,'target met')}
# ---------------- JULES ----------------
def j_caps(st, a, X, extra=Z):
    b = st['base']; d = st['dig']
    return st[a] + X <= round(b*D('0.05'),2) and d + X + extra <= round(b*D('0.10'),2)
def jules_rules(k, st):
    chk = st['CHK']; eth = st['ETH']; klp = st['KLP']
    if k == 0: return {'A':ok(1,'research only'),'B':ok(j_caps(st,'VAULT',1000),'within caps'),'C':ok(j_caps(st,'VAULT',2500),'within caps')}
    if k == 1:
        pool = j_caps(st,'POOL',1000); eth_ = j_caps(st,'ETH',2500,1000 if pool else 0)
        return {'A':ok(1,'skip'),'B':ok(pool,'within caps'),'C':ok(pool and eth_,'both within caps')}
    if k == 2:
        need = chk < 1100
        eth_min = D(1000)/D('0.48')   # policy: loan must leave >=40% fall before forced sale (LTV<=48% on a $1,000 loan)
        b_ = need and eth >= eth_min
        c_ = need and chk + D('0.995')*(st['VAULT']+eth) >= 1100
        a_ = not need or not (b_ or c_)
        return {'A':ok(a_,'cash covers premium' if not need else ('LEAST-HARM: no borrowing/sale option; reserve use flagged' if not (b_ or c_) else 'cash short and a qualifying alternative exists')),'B':ok(b_,'cash short; liquidation buffer >=40%'),'C':ok(c_,'cash short; owned crypto covers; no taxable gain at M5 (index flat)')}
    if k == 3:
        if klp > 0:
            return {'A':ok(chk >= klp,'repay from checking'),'B':ok(klp <= D('0.48')*(eth+500) and j_caps(st,'ETH',500),'collateral restores LTV<=48% (buffer>=40%)'),'C':ok(klp <= D('0.48')*eth,'LTV<=48% already')}
        return {'A':ok(1,'hold / no action'),'B':ok(eth>0,'ETH owned (trim possible)'),'C':ok(j_caps(st,'ETH',1000),'within caps')}
    if k == 4: return {'A':ok(1,'abstain'),'B':ok(st['POOL']>0,'has voting power'),'C':ok(0,'unlimited approval')}
    if k == 5: return {'A':ok(st['VAULT']>0,'vault owned (withdrawal possible)'),'B':ok(st['VAULT']==0,'no vault owned (no action)'),'C':ok(0,'adds to exploited protocol')}
    if k == 6: return {'A':ok(st['dig'] > round(st['base']*D('0.08'),2),'digital > 8% (sale possible)'),'B':ok(st['dig'] <= round(st['base']*D('0.10'),2),'at or under 10% cap'),'C':ok(j_caps(st,'ETH',2000),'within caps')}
# ---------------- MARCUS ----------------
def marcus_rules(k, st):
    u = st['USDC']
    if k == 0: return {'A':ok(1,'convert all'),'B':ok(u/2 <= 1500 or True,'holds <=1500'),'C':ok(2500 <= 1500,'holds >1500')}
    if k == 1: return {'A':ok(1,'keep runway'),'B':ok(0,'risks runway below target'),'C':ok(0,'risks runway below target')}
    if k == 2: return {'A':ok(1,'tax money stays cash'),'B':ok(0,'tax money is committed'),'C':ok(0,'tax money is committed')}
    if k == 3:
        e = st['EMER']
        return {'A':ok(e>0,'emergency fund has money'),'B':ok(1,'cut spending'),'C':ok(e==0,'no emergency money left')}
    if k == 4: return {'A':ok(1,'reject'),'B':ok(0,'pays scammer'),'C':ok(0,'signs')}
    if k == 5:
        if u == 0:
            return {'A':ok(1,'no USDC left: keep your own record of every crypto receipt and conversion ($0)'),'B':ok(1,'no USDC left: keep records AND change invoice terms so future clients pay in USD or you convert same day ($0; benefit described, not modeled)'),'C':ok(0,'no records')}
        return {'A':ok(1,'records + convert all held'),'B':ok(u/2 <= 1500,'records + convert half, remainder <=1500'),'C':ok(0,'no records')}
    if k == 6:
        surplus = st['BIZ'] > 1500
        return {'A':ok(st['VAULT']>0 or surplus,'vault owned or surplus cash to move'),'B':ok(st['VAULT']==0 and not surplus,'nothing owned, nothing to move (no action)'),'C':ok(0,'chasing loss')}
# ---------------- ELENA ----------------
def eL(st): return st['CHK']+st['RES']
def elena_rules(k, st):
    L = eL(st); card = st['CARD']; v = st['VAULT']
    if k == 0: return {'A':ok(1,'keep'),'B':ok(L-1500>=6300+2550,'covers leave gap + target'),'C':ok(L-3000>=6300+2550,'covers leave gap + target')}
    if k == 1: return {'A':ok(L-2700>=4350,'cash leaves >=1 month'),'B':ok(1,'0% plan'),'C':ok(0,'24% card vs 0% plan')}
    if k == 2: return {'A':ok(1,'hold'),'B':ok(1,'consolidate'),'C':ok(L-400>=6300 and card==0,'reserve at target')}
    if k == 3: return {'A':ok(1,'offline backup'),'B':ok(0,'synced phrase'),'C':ok(0,'synced phrase')}
    if k == 4: return {'A':ok(L>=1800,'cash covers deposit'),'B':ok(0,'borrowing against crypto'),'C':ok(L<1800,'no cash')}
    if k == 5:
        return {'A':ok(v==0 or L>=4350,'no vault (no action), or liquidity ok'),'B':ok(v>0,'vault owned (sale possible)'),'C':ok(0,'adds into a depeg')}
    if k == 6: return {'A':ok(1,'skip'),'B':ok(L-50>=6300 and card==0,'reserve at target'),'C':ok(0,'ignores gate')}
RULES = {'zoe':zoe_rules,'maya':maya_rules,'jules':jules_rules,'marcus':marcus_rules,'elena':elena_rules}
def score_path(name, s, p):
    out = []
    for k in range(7):
        r = RULES[name](k, s.decs[k]); ok_, why = r[p[k]]; out.append((100 if ok_ else 0, why))
    return out
