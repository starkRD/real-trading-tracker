 "use client";
import {useEffect,useMemo,useState} from "react";
import * as XLSX from "xlsx";
import {canonical,Position,Strategy,Tx} from "@/lib/types";
import {defaultPositions,sourceSnapshot,startingCapital} from "@/lib/defaults";

const money=(n:number|null|undefined)=>n==null?"—":`₹${Math.round(n).toLocaleString("en-IN")}`;
const pct=(n:number|null|undefined)=>n==null?"—":`${n>=0?"+":""}${n.toFixed(2)}%`;
const cls=(n:number|null|undefined)=>n==null?"":n>=0?"pos":"neg";

function App(){
 const [positions,setPositions]=useState<Position[]>(defaultPositions);
 const [txs,setTxs]=useState<Tx[]>([]);
 const [cash,setCash]=useState(startingCapital-sourceSnapshot.activeInvestment);
 const [seven,setSeven]=useState<{booked:number;running:number;active:string[]}>({booked:.42,running:-1.20,active:[]});
 const [modal,setModal]=useState(false);
 const [selected,setSelected]=useState<Position|null>(null);
 const [notice,setNotice]=useState("Source snapshot loaded from your TRADES workbook structure.");
 const [importing,setImporting]=useState(false);

 useEffect(()=>{try{const raw=localStorage.getItem("rtt-v3-state");if(raw){const s=JSON.parse(raw);if(s.positions)setPositions(s.positions);if(s.txs)setTxs(s.txs);if(typeof s.cash==="number")setCash(s.cash)}}catch{}},[]);
 useEffect(()=>{localStorage.setItem("rtt-v3-state",JSON.stringify({positions,txs,cash}))},[positions,txs,cash]);

 async function refresh7(){
   try{const r=await fetch("/api/7bar",{cache:"no-store"});const text=await r.text(); if(!r.ok)throw new Error(text);
   const rows=text.split(/\r?\n/).filter(Boolean).map(x=>x.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(v=>v.replace(/^"|"$/g,"")));
   const header=rows.find(r=>r.some(c=>c.trim().toLowerCase()==="ticker"));
   const hi=header?rows.indexOf(header):-1;
   let booked=.42,running=-1.2,active:string[]=[];
   for(const r of rows){const line=r.join(" ");if(/7Bar Booked/i.test(line)){const m=line.match(/7Bar Booked[^0-9-]*(-?\d+(?:\.\d+)?)%/i);if(m)booked=Number(m[1])} if(/7Bar Running/i.test(line)){const m=line.match(/7Bar Running[^0-9-]*(-?\d+(?:\.\d+)?)%/i);if(m)running=Number(m[1])}}
   if(hi>=0) for(const r of rows.slice(hi+1)){const t=canonical(r[0]||"");const status=r.find(c=>/active/i.test(c));if(t&&status&&/active/i.test(status))active.push(t)}
   setSeven({booked,running,active});setNotice(`7Bar refreshed ${new Date().toLocaleTimeString()}`);
   }catch(e){setNotice(e instanceof Error?e.message:"7Bar refresh failed")}
 }
 function addTx(tx:Tx){
   const key=canonical(tx.ticker);let next=[...positions];const idx=next.findIndex(p=>canonical(p.ticker)===key);
   if(tx.action==="BUY"){
     if(idx<0) next.push({ticker:key,strategy:tx.strategy,qty:tx.qty,avgBuy:tx.price,invested:tx.qty*tx.price,avgSell:null,booked:0,cmp:null,value:null,running:null,runningPct:null});
     else {const p=next[idx];const inv=p.invested+tx.qty*tx.price,q=p.qty+tx.qty;next[idx]={...p,qty:q,invested:inv,avgBuy:inv/q,strategy:tx.strategy};}
     setCash(c=>c-tx.qty*tx.price);
   }else{
     if(idx<0)return;
     const p=next[idx];const q=Math.min(tx.qty,p.qty);const realized=q*(tx.price-p.avgBuy);const left=p.qty-q;const invLeft=Math.max(0,p.invested-p.avgBuy*q);
     setCash(c=>c+q*tx.price);
     if(left<=0)next.splice(idx,1); else next[idx]={...p,qty:left,invested:invLeft,booked:p.booked+realized,avgSell:tx.price,value:p.cmp==null?null:left*p.cmp,running:p.cmp==null?null:left*p.cmp-invLeft,runningPct:p.cmp==null?null:(left*p.cmp-invLeft)/invLeft*100};
   }
   setPositions(next);setTxs(t=>[...t,tx]);setModal(false);setNotice(`${tx.action} recorded for ${key}`);
 }
 function importWorkbook(file:File){
   setImporting(true);const reader=new FileReader();
   reader.onload=()=>{try{
     const wb=XLSX.read(reader.result,{type:"array"});const ws=wb.Sheets[wb.SheetNames.find(n=>n.toLowerCase()==="trades")||wb.SheetNames[0]];
     const rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(ws,{defval:null});
     const active=rows.filter(r=>String(r["Trade Status"]??r["Status"]??"").toLowerCase().includes("active") && Number(r["Current Holding"]??r["Current Holding "]??0)>0);
     const mapped:Position[]=active.map((r)=>{const ticker=canonical(String(r["Trade Name"]??r["Ticker"]??""));const qty=Number(r["Current Holding"]??0);const invested=Number(r["Current Alocation"]??r["Current Allocation"]??0);const value=Number(r["Currnt Value"]??r["Current Value"]??0);const cmp=Number(r["Currnt Price"]??r["Current Price"]??0)||null;const avg=qty?invested/qty:0;const running=value?value-invested:null;return {ticker,strategy:"7Bar Swing",qty,avgBuy:avg,invested,avgSell:null,booked:0,cmp,value,running,runningPct:invested?running!/invested*100:null}});
     if(mapped.length){setPositions(mapped);setCash(startingCapital-mapped.reduce((a,p)=>a+p.invested,0));setNotice(`Imported ${mapped.length} active positions from TRADES. Historical booked P&L remains from the workbook snapshot.`)}else setNotice("No active positions found in the imported Trades sheet.");
   }catch(e){setNotice(e instanceof Error?e.message:"Import failed")}finally{setImporting(false)}};reader.readAsArrayBuffer(file);
 }
 const invested=positions.reduce((a,p)=>a+p.invested,0), value=positions.reduce((a,p)=>a+(p.value??0),0), running=value-invested;
 const actualBooked=sourceSnapshot.netProfit, equity=cash+value;
 const active7=useMemo(()=>new Set(seven.active),[seven.active]);
 const activeCompare=positions.filter(p=>p.strategy==="7Bar Swing" && (seven.active.length===0 || active7.has(canonical(p.ticker))));
 return <main className="shell">
  <header className="top"><div className="brand"><div className="logo">RT</div><div><div className="title">Real Trading Tracker</div><div className="muted">7Bar vs your actual trading</div></div></div><div className="actions"><label className="btn"><input hidden type="file" accept=".xlsx,.xls,.csv" onChange={e=>e.target.files?.[0]&&importWorkbook(e.target.files[0])}/>{importing?"Importing…":"Import TRADES"}</label><button className="btn" onClick={refresh7}>↻ Refresh 7Bar</button><button className="btn primary" onClick={()=>setModal(true)}>＋ Add transaction</button></div></header>
  <div className="notice">{notice}</div>
  <section className="section"><div className="section-head"><div><div className="section-title">Portfolio overview</div><div className="muted small">Current state from your TRADES data + manual updates</div></div></div>
   <div className="grid4">
    <div className="card"><div className="kpi-label">Starting capital</div><div className="kpi">{money(startingCapital)}</div><div className="sub">Tracking capital</div></div>
    <div className="card"><div className="kpi-label">Invested</div><div className="kpi">{money(invested)}</div><div className="sub">{positions.length} active positions</div></div>
    <div className="card"><div className="kpi-label">Cash available</div><div className="kpi">{money(cash)}</div><div className="sub">Available to deploy</div></div>
    <div className="card"><div className="kpi-label">Total equity</div><div className="kpi">{money(equity)}</div><div className={`sub ${cls(running)}`}>{money(running)} running vs cost</div></div>
   </div>
  </section>
  <section className="section"><div className="section-title">7Bar vs My Actual</div><div className="grid2">
   <div className="card"><div className="kpi-label">Booked performance</div><div className={`hero-num ${cls(seven.booked)}`}>{pct(seven.booked)}</div><div className={`sub ${cls(seven.booked)}`}>{money(seven.booked/100*startingCapital)} model result</div><div className="compare-row"><span>7Bar Model</span><b className={cls(seven.booked)}>{pct(seven.booked)}</b></div><div className="compare-row"><span>My Actual</span><b className={cls(actualBooked)}>{money(actualBooked)}</b></div><div className="compare-row"><span>Gap</span><b className={cls(actualBooked-seven.booked/100*startingCapital)}>{money(actualBooked-seven.booked/100*startingCapital)}</b></div></div>
   <div className="card"><div className="kpi-label">Running performance</div><div className={`hero-num ${cls(running)}`}>{pct(invested?running/invested*100:0)}</div><div className={`sub ${cls(running)}`}>{money(running)} on current holdings</div><div className="compare-row"><span>7Bar Running</span><b className={cls(seven.running)}>{pct(seven.running)}</b></div><div className="compare-row"><span>My Running</span><b className={cls(running)}>{pct(invested?running/invested*100:0)}</b></div><div className="compare-row"><span>Difference</span><b>{pct((invested?running/invested*100:0)-seven.running)}</b></div></div>
  </div></section>
  <section className="section"><div className="section-head"><div><div className="section-title">Active positions</div><div className="muted small">Only positions you currently hold</div></div><span className="pill active">{positions.length} active</span></div>
   <div className="table-wrap"><table className="table"><thead><tr><th>Stock</th><th>Strategy</th><th>Qty</th><th>Avg buy</th><th>CMP</th><th>Invested</th><th>Value</th><th>Running P&L</th><th></th></tr></thead><tbody>{positions.map(p=><tr key={p.ticker} onClick={()=>setSelected(p)} style={{cursor:"pointer"}}><td className="stock">{p.ticker}</td><td><span className="pill active">{p.strategy}</span></td><td>{p.qty}</td><td>{money(p.avgBuy)}</td><td>{money(p.cmp)}</td><td>{money(p.invested)}</td><td>{money(p.value)}</td><td className={cls(p.running)}>{money(p.running)} <span className="small">({pct(p.runningPct)})</span></td><td>›</td></tr>)}</tbody></table></div>
  </section>
  <section className="section"><div className="section-head"><div><div className="section-title">7Bar active match</div><div className="muted small">Your current holdings that also appear as ACTIVE in 7Bar</div></div></div>
   <div className="table-wrap"><table className="table"><thead><tr><th>Stock</th><th>Your qty</th><th>Your running</th><th>7Bar</th><th>Status</th></tr></thead><tbody>{activeCompare.length?activeCompare.map(p=><tr key={p.ticker}><td className="stock">{p.ticker}</td><td>{p.qty}</td><td className={cls(p.running)}>{money(p.running)} ({pct(p.runningPct)})</td><td><span className="pill active">ACTIVE</span></td><td><span className="pill active">Matched</span></td></tr>):<tr><td colSpan={5} className="empty">Refresh 7Bar to populate the live active-match list.</td></tr>}</tbody></table></div>
  </section>
  <section className="section"><div className="section-head"><div><div className="section-title">Recent transactions</div><div className="muted small">Manual BUY / SELL activity in this browser</div></div></div>
   <div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Stock</th><th>Action</th><th>Qty</th><th>Price</th><th>Strategy</th></tr></thead><tbody>{txs.slice().reverse().map(t=><tr key={t.id}><td>{t.date}</td><td className="stock">{t.ticker}</td><td><span className={`pill ${t.action==="BUY"?"active":"closed"}`}>{t.action}</span></td><td>{t.qty}</td><td>{money(t.price)}</td><td>{t.strategy}</td></tr>)}{!txs.length&&<tr><td colSpan={6} className="empty">No manual transactions yet. Use “Add transaction”.</td></tr>}</tbody></table></div>
  </section>
  {modal&&<TxModal onClose={()=>setModal(false)} onSave={addTx}/>}
  {selected&&<div className="modal-bg" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="section-title">{selected.ticker}</div><div className="muted">Current position</div><div className="grid2"><div className="card"><div className="kpi-label">Holding</div><div className="kpi">{selected.qty}</div></div><div className="card"><div className="kpi-label">Invested</div><div className="kpi">{money(selected.invested)}</div></div><div className="card"><div className="kpi-label">Avg buy</div><div className="kpi">{money(selected.avgBuy)}</div></div><div className="card"><div className="kpi-label">Running</div><div className={`kpi ${cls(selected.running)}`}>{money(selected.running)}</div></div></div><div className="modal-actions"><button className="btn" onClick={()=>setSelected(null)}>Close</button><button className="btn primary" onClick={()=>{setSelected(null);setModal(true)}}>＋ Transaction</button></div></div></div>}
 </main>
}
function TxModal({onClose,onSave}:{onClose:()=>void;onSave:(t:Tx)=>void}){
 const [ticker,setTicker]=useState("");const [action,setAction]=useState<"BUY"|"SELL">("BUY");const [qty,setQty]=useState("");const [price,setPrice]=useState("");const [strategy,setStrategy]=useState<Strategy>("7Bar Swing");const [date,setDate]=useState(new Date().toISOString().slice(0,10));
 return <div className="modal-bg"><div className="modal"><div className="section-title">Add transaction</div><div className="muted">One BUY or SELL. The position recalculates automatically.</div><div className="formgrid" style={{marginTop:16}}><div className="field"><label>Stock</label><input value={ticker} onChange={e=>setTicker(e.target.value)} placeholder="LAURUSLABS"/></div><div className="field"><label>Action</label><select value={action} onChange={e=>setAction(e.target.value as "BUY"|"SELL")}><option>BUY</option><option>SELL</option></select></div><div className="field"><label>Quantity</label><input type="number" value={qty} onChange={e=>setQty(e.target.value)} /></div><div className="field"><label>Price</label><input type="number" value={price} onChange={e=>setPrice(e.target.value)} /></div><div className="field"><label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} /></div><div className="field"><label>Strategy</label><select value={strategy} onChange={e=>setStrategy(e.target.value as Strategy)}><option>7Bar Swing</option><option>Long Term</option><option>Personal Pick</option><option>Other</option></select></div></div><div className="modal-actions"><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!ticker||!qty||!price} onClick={()=>onSave({id:crypto.randomUUID(),ticker:canonical(ticker),action,qty:Number(qty),price:Number(price),date,strategy})}>Save transaction</button></div></div></div>
}
export default App;
