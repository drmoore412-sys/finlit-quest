"""Elena Torres journey: conditional variants from the DECISION-TIME state only (st = s.decs[k]). Constants are Elena's plan / locked model."""
from decimal import Decimal as D
TARGET=D(6300); CUSHION=D(4350); LEAVE_GAP=D(2550); DEPOSIT=D(1800); KEYSTONE_MIN_ETH=D(2000)
def Lq(st): return st['CHK']+st['RES']
def v1(st): L=Lq(st); return {'L':L,'B_ok':L-1500>=TARGET+LEAVE_GAP,'C_ok':L-3000>=TARGET+LEAVE_GAP}
def v2(st): L=Lq(st); return {'L':L,'A_ok':L-2700>=CUSHION,'after_cash':L-2700}
def v3(st): L=Lq(st); return {'L':L,'C_ok':(L-400>=TARGET) and st['CARD']==0,'card':st['CARD']>0,'plan_owed':st['MED']}
def v4(st): return {'eth_at_risk':st['ETH'],'has_eth':st['ETH']>0}
def v5(st): L=Lq(st); return {'L':L,'A_ok':L>=DEPOSIT,'loan_possible':st['ETH']>=KEYSTONE_MIN_ETH,'eth':st['ETH']}
def v6(st):
    L=Lq(st); has=st['VAULT']>0; low=L<CUSHION
    cls='none' if not has else ('low' if low else 'ok')
    return {'cls':cls,'L':L,'A_ok':(not has) or (not low),'B_ok':has}
def v7(st):
    L=Lq(st); cash_ok=L-50>=TARGET; card=st['CARD']>0
    cls='open' if (cash_ok and not card) else ('closed_card' if cash_ok else 'closed_cash')
    return {'L':L,'cash_ok':cash_ok,'card':card,'gate_open':cash_ok and not card,'cls':cls,'need':TARGET+50,'inst':min(D(225),st['MED']),'B_executes':(L-min(D(225),st['MED']))>=TARGET+50}
