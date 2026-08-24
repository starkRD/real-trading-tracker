import {ImportedState,Position,Transaction} from './types';
export const money=(n:number|null|undefined)=>`₹${Math.round(n||0).toLocaleString('en-IN')}`;
export const pct=(n:number|null|undefined)=>`${((n||0)*100).toFixed(2)}%`;
export function canonical(t:string, aliases:Record<string,string>={LTIM:'LTM'}){const u=t.trim().toUpperCase();return aliases[u]||u}
export function applyTransactions(base:Position[], txs:Transaction[]):{positions:Position[];realized:number}{
 const map=new Map(base.map(p=>[canonical(p.ticker),{...p}])); let realized=0;
 for(const t of txs){const key=canonical(t.ticker);const p=map.get(key);
  if(t.action==='BUY'){
   if(p){const total=p.invested+t.qty*t.price;const q=p.qty+t.qty;p={...p,qty:q,invested:total,avgBuy:q?total/q:p.avgBuy};map.set(key,p)}
   else map.set(key,{ticker:key,qty:t.qty,avgBuy:t.price,invested:t.qty*t.price,currentPrice:null,currentValue:null,running:null,runningPct:null,status:'Active',strategy:t.strategy});
  } else if(p){const q=Math.min(t.qty,p.qty);const avg=p.qty?p.invested/p.qty:0;realized+=q*(t.price-avg);const left=p.qty-q;const investedLeft=Math.max(0,p.invested-avg*q);if(left<=0)map.delete(key);else map.set(key,{...p,qty:left,invested:investedLeft,avgBuy:left?investedLeft/left:p.avgBuy,currentValue:p.currentPrice==null?null:left*p.currentPrice,running:p.currentPrice==null?null:left*p.currentPrice-investedLeft,runningPct:investedLeft&&p.currentPrice!=null?(left*p.currentPrice-investedLeft)/investedLeft:null});}
 }
 const positions=[...map.values()].filter(p=>p.qty>0);
 return {positions,realized};
}
export function summarize(state:ImportedState, positions:Position[], realized:number){const running=positions.reduce((a,p)=>a+(p.running||0),0);const invested=positions.reduce((a,p)=>a+p.invested,0);const value=positions.reduce((a,p)=>a+(p.currentValue||0),0);const booked=state.historicalBooked+realized;const cash=state.startingCapital-invested+booked;return {running,invested,value,booked,totalPnl:booked+running,cash,equity:cash+value,runningPct:invested?running/invested:0,bookedPct:state.startingCapital?booked/state.startingCapital:0};}
