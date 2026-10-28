"""Marcus Rivera journey: conditional variants computed from the DECISION-TIME state only (st = s.decs[k]); constants are Marcus's plan."""
from decimal import Decimal as D, ROUND_HALF_UP
def r2(x): return D(x).quantize(D('0.01'), ROUND_HALF_UP)
FLOOR=D(1500); STABLE=D(1500); TARGET=D(6000)
def v4(st):
    draw=min(D(3000),st['BIZ']); gap=max(D(0),D(3000)-st['PER']-draw)   # personal shortfall this month if spending stays $3,000
    return {'gap':gap,'has_emer':st['EMER']>0}
def v5(st):
    risk=st['USDC']+st['VAULT']+st['ETH']+st['TAXV']
    return {'risk':risk,'items':{a:st[a] for a in('USDC','ETH','VAULT','TAXV') if st[a]>0}}
def v6(st):
    u=st['USDC']; return {'u':u,'conv_all_fee':r2(u*D('0.01')),'half':r2(u*D('0.5')),'half_fee':r2(r2(u*D('0.5'))*D('0.01')),'remainder_ok':(u/2<=STABLE)}
def v7(st):
    surplus=st['BIZ']>FLOOR; has=st['VAULT']>0
    cls='vault' if has else ('surplus' if surplus else 'nothing')
    return {'cls':cls,'A_exec':has or surplus,'B_ok':(not has) and (not surplus),'C_exec':st['BIZ']+st['EMER']>=D(2000),'surplus':max(D(0),st['BIZ']-FLOOR)}
