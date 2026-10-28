"""Jules v0.1 player-visible variants computed ONLY from the decision-time snapshot s.decs[k] (no hindsight)."""
from decimal import Decimal as D
def r2(x): return x.quantize(D('0.01'))
def caps(st):
    b=st['base']; return r2(b*D('0.05')), r2(b*D('0.10'))
def pos_ok(st,a,X,extra=D(0)):
    p5,p10=caps(st); return st[a]+X<=p5 and st['dig']+X+extra<=p10
def v1(st):  # D1: B $1,000 vault, C $2,500 vault
    return {'B':pos_ok(st,'VAULT',D(1000)),'C':pos_ok(st,'VAULT',D(2500))}
def v2(st):  # D2: B pool $1,000 ; C pool $1,000 + ETH $2,500
    pool=pos_ok(st,'POOL',D(1000)); eth=pos_ok(st,'ETH',D(2500),D(1000) if pool else D(0))
    return {'B_exec':pool,'C_pool':pool,'C_eth':eth}
def v3(st):  # D3 premium $1,100
    need=st['CHK']<1100
    return {'cash_covers':not need,'B_exec':st['ETH']>=2000,'C_exec':(st['ETH']>0 or st['VAULT']>0)}
def v4(st):
    loan=st['KLP']>0
    if loan:
        ltv=st['KLP']/st['ETH']; ltvB=st['KLP']/(st['ETH']+D('497.50'))
        return {'mode':'loan','ltv':ltv,'ltvB':ltvB,'A_exec':st['CHK']>=st['KLP']}
    return {'mode':'noloan','B_exec':st['ETH']>0,'C_exec':pos_ok(st,'ETH',D(1000))}
def v5(st): return {'has_pool':st['POOL']>0}
def v6(st): return {'has_vault':st['VAULT']>0,'C_exec':pos_ok(st,'VAULT',D(500))}
def v7(st):
    b=st['base']; t8=r2(b*D('0.08'))
    return {'over8':st['dig']>t8,'C_exec':pos_ok(st,'ETH',D(2000))}
