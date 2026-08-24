'use client';
import {Position} from '@/lib/types';
import {money,pct} from '@/lib/utils';

type Props={positions:Position[];onEdit?:(p:Position)=>void;activeTickers?:Set<string>;showOnly7BarActive?:boolean};

export default function ActiveTable({positions,onEdit,activeTickers,showOnly7BarActive=false}:Props){
 const rows=positions.filter(p=>p.qty>0).filter(p=>!showOnly7BarActive || (p.strategy==='7Bar Swing' && !!activeTickers?.has(p.ticker)));
 return <div className="card overflow-hidden">
  <div className="border-b border-zinc-800 p-5">
   <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Active Positions</h2><p className="mt-1 text-xs text-zinc-500">Only current holdings are shown. Dashboard view also requires the stock to be ACTIVE in 7Bar.</p></div><div className="pill">{rows.length} active</div></div>
  </div>
  <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-sm"><thead className="bg-zinc-900/60 text-left text-[11px] uppercase tracking-wider text-zinc-500"><tr>{['Stock','Strategy','Qty','Avg Buy','Avg Sell','CMP','Invested','Value','Booked','Running','P&L %',''].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead>
  <tbody>{rows.map(p=><tr key={`${p.ticker}-${p.strategy}`} className="border-t border-zinc-900"><td className="px-4 py-4 font-semibold">{p.ticker}</td><td><span className="pill">{p.strategy}</span></td><td>{p.qty}</td><td>{money(p.avgBuy)}</td><td>{p.avgSell?money(p.avgSell):'—'}</td><td>{p.currentPrice===null?'—':money(p.currentPrice)}</td><td>{money(p.invested)}</td><td>{p.currentPrice===null?'—':money(p.marketValue)}</td><td className={p.realized>=0?'text-emerald-400':'text-red-400'}>{money(p.realized)}</td><td className={p.running>=0?'text-emerald-400':'text-red-400'}>{money(p.running)}</td><td className={p.runningPct>=0?'text-emerald-400':'text-red-400'}>{pct(p.runningPct)}</td><td>{onEdit?<button className="btn px-3 py-1.5" onClick={()=>onEdit(p)}>Manage</button>:null}</td></tr>)}{!rows.length&&<tr><td colSpan={12} className="p-10 text-center text-zinc-500">No matching active 7Bar positions.</td></tr>}</tbody></table></div>
 </div>
}
