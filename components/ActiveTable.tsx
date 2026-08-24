import {BarModel,ActualTrade} from "@/lib/types"; import {canonical,cls,pct} from "@/lib/utils";
export default function ActiveTable({model,actual,aliases}:{model:BarModel[];actual:ActualTrade[];aliases:Record<string,string>}){
 const a=new Map(actual.filter(x=>x.tradeStatus.toLowerCase()==="active").map(x=>[canonical(x.ticker,aliases),x]));
 const rows=model.filter(x=>x.tradeStatus.toLowerCase()==="active" && x.ticker.toUpperCase()!=="CASH");
 return <div className="card overflow-hidden"><div className="border-b border-zinc-800 p-5"><div className="text-lg font-semibold">Active Trades</div><div className="mt-1 text-sm text-zinc-500">Live 7Bar position vs your actual position.</div></div>
 <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-sm"><thead className="bg-zinc-900/60 text-left text-xs uppercase text-zinc-500"><tr><th className="p-4">Stock</th><th>7Bar CMP</th><th>7Bar Running</th><th>Your Price</th><th>Your Running</th><th>Difference</th><th>7Bar Status</th></tr></thead>
 <tbody>{rows.map(m=>{const x=a.get(canonical(m.ticker,aliases)); const mp=m.runningPf??0; const ap=x?.runningPf??null; const d=ap===null?null:ap-mp; return <tr key={m.ticker} className="border-t border-zinc-900">
 <td className="p-4 font-semibold">{m.ticker}{x&&canonical(m.ticker,aliases)!==x.ticker.toUpperCase()?<span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">alias</span>:null}</td>
 <td>₹{m.cmp?.toLocaleString("en-IN")??"—"}</td><td className={cls(mp)}>{pct(mp)}</td><td>{x?.currentPrice?`₹${x.currentPrice.toLocaleString("en-IN")}`:"—"}</td><td className={ap===null?"text-zinc-500":cls(ap)}>{ap===null?"Not in TRADES":pct(ap)}</td><td className={d===null?"text-zinc-500":cls(d)}>{d===null?"—":pct(d)}</td><td className="text-zinc-400">{m.status||"—"}</td>
 </tr>})}</tbody></table></div></div>
}
