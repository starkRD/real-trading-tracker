import {Position,Strategy,Transaction} from './types';
import {canonical} from './utils';
export function buildPositions(txns:Transaction[],aliases:Record<string,string>,prices:Record<string,number>):Position[]{
 const groups=new Map<string,Transaction[]>();
 for(const t of txns){const key=`${canonical(t.ticker,aliases)}|${t.strategy}`;if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(t)}
 const out:Position[]=[];
 for(const [,arr] of groups){arr.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));let qty=0,cost=0,realized=0,sellQty=0,sellValue=0;
  for(const t of arr){if(t.action==='BUY'){qty+=t.qty;cost+=t.qty*t.price}else{const avg=qty>0?cost/qty:0;const q=Math.min(t.qty,qty);realized+=(t.price-avg)*q;qty-=q;cost-=avg*q;sellQty+=q;sellValue+=q*t.price}}
  const first=arr[0];const ticker=canonical(first.ticker,aliases);const avgBuy=qty>0?cost/qty:0;const avgSell=sellQty>0?sellValue/sellQty:0;const invested=cost;const cp=prices[ticker]??null;const marketValue=cp!==null?qty*cp:0;const running=cp!==null?marketValue-cost:0;const runningPct=cost>0?running/cost*100:0;
  if(qty>0 || realized!==0)out.push({ticker,strategy:first.strategy,qty,avgBuy,invested,avgSell,realized,currentPrice:cp,marketValue,running,runningPct});
 }
 return out.sort((a,b)=>a.ticker.localeCompare(b.ticker));
}
export function cashBalance(txns:Transaction[],capital:number){return capital-txns.reduce((s,t)=>s+(t.action==='BUY'?t.qty*t.price:-t.qty*t.price),0)}
export function realizedPnl(txns:Transaction[],aliases:Record<string,string>){let total=0;const positions=new Map<string,{qty:number;cost:number}>();for(const t of [...txns].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))){const k=`${canonical(t.ticker,aliases)}|${t.strategy}`;const p=positions.get(k)||{qty:0,cost:0};if(t.action==='BUY'){p.qty+=t.qty;p.cost+=t.qty*t.price}else{const q=Math.min(t.qty,p.qty);const avg=p.qty?p.cost/p.qty:0;total+=(t.price-avg)*q;p.qty-=q;p.cost-=avg*q}positions.set(k,p)}return total}
export function currentInvested(txns:Transaction[],aliases:Record<string,string>){return buildPositions(txns,aliases,{}).reduce((s,p)=>s+p.invested,0)}
