"use client";
import {useEffect,useMemo,useState} from "react";
import {canonical} from "@/lib/canonical";
import type {Position,SevenData,Transaction,TradesData} from "@/lib/types";

const CAPITAL=300000;
const SEVEN_URL="https://docs.google.com/spreadsheets/d/1uLyXG-BXWTjQ7secLVmQkSXduO8EaQIHT6GWQQ4Oe4g/edit?gid=2061682406#gid=2061682406";
const TRADES_URL="https://docs.google.com/spreadsheets/d/1DS_j0bSRdVBlLTND5R4TUHMdTAhk3SbN5AT8SDJma20/edit?gid=0#gid=0";
const money=(n:number|null|undefined)=>n==null?"—":`${n<0?"−":""}₹${Math.round(Math.abs(n)).toLocaleString("en-IN")}`;
const pct=(n:number|null|undefined)=>n==null?"—":`${n>=0?"+":"−"}${Math.abs(n).toFixed(2)}%`;
const tone=(n:number|null|undefined)=>n==null?"":n>=0?"good":"bad";
const signedPp=(n:number)=>`${n>=0?"+":"−"}${Math.abs(n).toFixed(2)} pp`;

function Card({label,value,sub,className=""}:{label:string;value:React.ReactNode;sub?:React.ReactNode;className?:string}){return <div className={`card kpi-card ${className}`}><div className="eyebrow">{label}</div><div className="big-number">{value}</div>{sub&&<div className="sub">{sub}</div>}</div>}
function Section({title,desc,children,action}:{title:string;desc?:string;children:React.ReactNode;action?:React.ReactNode}){return <section className="section"><div className="section-head"><div><h2>{title}</h2>{desc&&<p>{desc}</p>}</div>{action}</div>{children}</section>}

export default function App(){
 const [seven,setSeven]=useState<SevenData>({bookedPct:null,runningPct:null,active:[],closed:[],syncedAt:null});
 const [trades,setTrades]=useState<TradesData>({positions:[],booked:0,invested:0,value:0,sourceRows:0,syncedAt:null});
 const [manual,setManual]=useState<Transaction[]>([]);
 const [manualPositions,setManualPositions]=useState<Position[]>([]);
 const [sevenLoading,setSevenLoading]=useState(false); const [tradesLoading,setTradesLoading]=useState(false);
 const [notice,setNotice]=useState("Loading live sheets…");
 const [showSettings,setShowSettings]=useState(false); const [tradesUrl,setTradesUrl]=useState(TRADES_URL);
 const [showTx,setShowTx]=useState(false); const [selected,setSelected]=useState<Position|null>(null);

 async function refreshSeven(){setSevenLoading(true);try{const r=await fetch("/api/7bar",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"7Bar refresh failed");setSeven(d);setNotice(`7Bar refreshed ${new Date().toLocaleTimeString()}`);}catch(e){setNotice(e instanceof Error?e.message:"7Bar refresh failed")}finally{setSevenLoading(false)}}
 async function refreshTrades(url=tradesUrl){setTradesLoading(true);try{const r=await fetch("/api/trades",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({url}),cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"TRADES refresh failed");setTrades(d);setManual([]);setManualPositions([]);setNotice(`TRADES refreshed: ${d.positions.length} active holdings`);}catch(e){setNotice(e instanceof Error?e.message:"TRADES refresh failed")}finally{setTradesLoading(false)}}
 useEffect(()=>{void refreshSeven();void refreshTrades(TRADES_URL)},[]);

 const positions=useMemo(()=>applyManual(trades.positions,manual),[trades.positions,manual]);
 const invested=positions.reduce((a,p)=>a+p.invested,0);
 const value=positions.reduce((a,p)=>a+(p.currentValue??0),0);
 const running=value-invested;
 const runningPct=invested?running/invested*100:0;
 const actualBooked=trades.booked+manualRealized(trades.positions,manual);
 const cash=CAPITAL+actualBooked-invested;
 const equity=cash+value;
 const sevenBooked=seven.bookedPct??0; const sevenRunning=seven.runningPct??0;
 const sevenBookedValue=CAPITAL*sevenBooked/100; const sevenRunningValue=CAPITAL*sevenRunning/100;
 const bookedGapValue=actualBooked-sevenBookedValue; const bookedGapPct=actualBooked/CAPITAL*100-sevenBooked;
 const runningGapValue=running-sevenRunningValue; const runningGapPct=runningPct-sevenRunning;
 const activeMap=useMemo(()=>new Map(seven.active.map(t=>[canonical(t.ticker),t])),[seven.active]);
 const matched=positions.filter(p=>activeMap.has(canonical(p.ticker)));
 const actualOnly=positions.filter(p=>!activeMap.has(canonical(p.ticker)));
 const sevenOnly=seven.active.filter(t=>!positions.some(p=>canonical(p.ticker)===canonical(t.ticker)));
 const missingClosed=seven.closed.filter(t=>!trades.positions.some(p=>canonical(p.ticker)===canonical(t)));

 function addTransaction(t:Transaction){
   setManual(m=>[...m,t]);
   setShowTx(false);setNotice(`${t.action} recorded for ${canonical(t.ticker)}. This session's actual view has been updated.`);
 }
 return <div className="app">
   <header className="topbar"><div><div className="brand">Real Trading Tracker</div><div className="tagline">7Bar model vs your actual execution</div></div><div className="top-actions"><button className="btn ghost" onClick={()=>setShowSettings(true)}>⚙ Sheets</button><button className="btn ghost" onClick={()=>void refreshSeven()} disabled={sevenLoading}>↻ Refresh 7Bar</button><button className="btn primary" onClick={()=>setShowTx(true)}>＋ Add transaction</button></div></header>
   <div className="notice">{notice}<span className="source-state">7Bar: {seven.syncedAt?new Date(seven.syncedAt).toLocaleTimeString():"—"} · TRADES: {trades.syncedAt?new Date(trades.syncedAt).toLocaleTimeString():"—"}</span></div>

   <main>
    <div className="hero"><div><div className="eyebrow">PERSONAL PERFORMANCE DASHBOARD</div><h1>7Bar vs My Actual Result</h1><p>Model performance compared with what your TRADES sheet says you actually hold and have booked.</p></div></div>

    <Section title="Portfolio at a glance" desc="All figures below exclude broker charges until V2/V4 broker integration.">
      <div className="grid4">
       <Card label="Starting capital" value={money(CAPITAL)} sub="Tracking capital"/>
       <Card label="Currently invested" value={money(invested)} sub={`${positions.length} current holding${positions.length===1?"":"s"}`}/>
       <Card label="Cash available" value={<span className="good">{money(cash)}</span>} sub="Capital + booked − current cost"/>
       <Card label="Total equity" value={<span className={tone(equity-CAPITAL)}>{money(equity)}</span>} sub={`Cash + current portfolio value · ${money(equity-CAPITAL)} total P&L`}/>
      </div>
    </Section>

    <div className="compare-grid">
      <Performance title="BOOKED PERFORMANCE" modelPct={sevenBooked} modelValue={sevenBookedValue} actualPct={actualBooked/CAPITAL*100} actualValue={actualBooked} gapPct={bookedGapPct} gapValue={bookedGapValue} modelLabel="7Bar Booked" actualLabel="My Booked"/>
      <Performance title="RUNNING PERFORMANCE" modelPct={sevenRunning} modelValue={sevenRunningValue} actualPct={runningPct} actualValue={running} gapPct={runningGapPct} gapValue={runningGapValue} modelLabel="7Bar Running" actualLabel="My Running"/>
    </div>

    <Section title="What the numbers mean" desc="The model percentage comes directly from the 7Bar summary. Actual running is calculated only from current holdings in TRADES.">
      <div className="explain-grid">
       <div className="explain"><span>7Bar booked</span><strong className={tone(sevenBooked)}>{pct(sevenBooked)}</strong><small>{money(sevenBookedValue)} on ₹3L model capital</small></div>
       <div className="explain"><span>My booked</span><strong className={tone(actualBooked)}>{pct(actualBooked/CAPITAL*100)}</strong><small>{money(actualBooked)} realized result</small></div>
       <div className="explain"><span>7Bar running</span><strong className={tone(sevenRunning)}>{pct(sevenRunning)}</strong><small>{money(sevenRunningValue)} on ₹3L model capital</small></div>
       <div className="explain"><span>My running</span><strong className={tone(running)}>{pct(runningPct)}</strong><small>{money(running)} on ₹{Math.round(invested).toLocaleString("en-IN")} invested</small></div>
      </div>
    </Section>

    <Section title="Active trades" desc="A match exists only when the stock is ACTIVE in 7Bar and you currently hold it in TRADES." action={<span className="count-pill">{matched.length} matched</span>}>
      {matched.length===0?<Empty text="No active 7Bar / actual matches yet."/>:<div className="table-wrap"><table><thead><tr><th>Stock</th><th>7Bar PF</th><th>Your qty</th><th>Your invested</th><th>Your value</th><th>Your running</th><th>Difference</th><th></th></tr></thead><tbody>{matched.map(p=>{const b=activeMap.get(canonical(p.ticker));const d=(p.runningPct??0)-(b?.runningPct??0);return <tr key={p.ticker} onClick={()=>setSelected(p)}><td className="stock">{p.ticker}</td><td className={tone(b?.runningPct)}>{pct(b?.runningPct)}</td><td>{p.qty}</td><td>{money(p.invested)}</td><td>{money(p.currentValue)}</td><td className={tone(p.running)}>{money(p.running)} <small>({pct(p.runningPct)})</small></td><td className={tone(d)}>{signedPp(d)}</td><td>›</td></tr>})}</tbody></table></div>}
    </Section>

    <div className="two-col">
      <Section title="7Bar active not in my holdings" desc="These are currently ACTIVE in 7Bar but absent from your current TRADES holdings.">
       {sevenOnly.length===0?<div className="success-box">✓ All active 7Bar trades are represented in your holdings.</div>:<div className="stack">{sevenOnly.map(t=><div className="alert-row" key={t.ticker}><div><strong>{t.ticker}</strong><span>7Bar running {pct(t.runningPct)}</span></div><b>{pct(t.runningPct)}</b></div>)}</div>}
      </Section>
      <Section title="Trades not currently ACTIVE in 7Bar" desc="Useful for spotting personal trades or stale 7Bar positions.">
       {actualOnly.length===0?<div className="success-box">✓ Every current holding matches an ACTIVE 7Bar trade.</div>:<div className="stack">{actualOnly.map(p=><div className="neutral-row" key={p.ticker}><div><strong>{p.ticker}</strong><span>{p.qty} shares · {money(p.invested)} invested</span></div><b className={tone(p.running)}>{pct(p.runningPct)}</b></div>)}</div>}
      </Section>
    </div>

    <Section title="Missing closed 7Bar trades" desc="Closed model trades that cannot be found anywhere in your TRADES sheet after ticker-name normalization.">
      {missingClosed.length===0?<div className="success-box">✓ No missing closed 7Bar trades detected.</div>:<div className="chips">{missingClosed.map(t=><span key={t} className="chip">⚠{t}</span>)}</div>}
    </Section>
   </main>

   {showSettings&&<div className="modal-bg" onClick={()=>setShowSettings(false)}><div className="modal" onClick={(e:any)=>e.stopPropagation()}><div className="modal-head"><div><h2>Sheet sources</h2><p>Both sheets are fetched server-side, so the Google Sheet does not need browser CORS access.</p></div><button className="icon-btn" onClick={()=>setShowSettings(false)}>×</button></div><label>TRADES Google Sheet URL</label><input value={tradesUrl} onChange={(e:any)=>setTradesUrl(e.target.value)} /><div className="hint">7Bar is fixed to the public model sheet. No environment variable is required.</div><div className="modal-actions"><button className="btn ghost" onClick={()=>setShowSettings(false)}>Cancel</button><button className="btn primary" disabled={tradesLoading} onClick={()=>{setShowSettings(false);void refreshTrades(tradesUrl)}}>↻ Fetch TRADES</button></div></div></div>}
   {showTx&&<TxModal onClose={()=>setShowTx(false)} onSave={addTransaction} positions={positions}/>} 
   {selected&&<div className="modal-bg" onClick={()=>setSelected(null)}><div className="modal" onClick={(e:any)=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">CURRENT HOLDING</div><h2>{selected.ticker}</h2></div><button className="icon-btn" onClick={()=>setSelected(null)}>×</button></div><div className="grid2"><Card label="Quantity" value={selected.qty}/><Card label="Invested" value={money(selected.invested)}/><Card label="CMP" value={money(selected.currentPrice)}/><Card label="Running" value={<span className={tone(selected.running)}>{money(selected.running)}</span>} sub={pct(selected.runningPct)}/></div><div className="modal-actions"><button className="btn ghost" onClick={()=>setSelected(null)}>Close</button><button className="btn primary" onClick={()=>{setSelected(null);setShowTx(true)}}>＋ Transaction</button></div></div></div>}
 </div>
}

function Performance({title,modelPct,modelValue,actualPct,actualValue,gapPct,gapValue,modelLabel,actualLabel}:{title:string;modelPct:number;modelValue:number;actualPct:number;actualValue:number;gapPct:number;gapValue:number;modelLabel:string;actualLabel:string}){return <section className="perf-card"><div className="eyebrow">{title}</div><div className={`hero-value ${tone(gapPct)}`}>{pct(actualPct)}</div><div className={`hero-money ${tone(actualValue)}`}>{money(actualValue)} <span>actual</span></div><div className="compare-lines"><div><span>{modelLabel}</span><b className={tone(modelPct)}>{pct(modelPct)} <em>{money(modelValue)}</em></b></div><div><span>{actualLabel}</span><b className={tone(actualPct)}>{pct(actualPct)} <em>{money(actualValue)}</em></b></div><div className="gap"><span>Difference</span><b className={tone(gapPct)}>{signedPp(gapPct)} <em>{money(gapValue)}</em></b></div></div></section>}

function TxModal({onClose,onSave,positions}:{onClose:()=>void;onSave:(t:Transaction)=>void;positions:Position[]}){const [ticker,setTicker]=useState("");const [action,setAction]=useState<"BUY"|"SELL">("BUY");const [qty,setQty]=useState("");const [price,setPrice]=useState("");const [strategy,setStrategy]=useState("7Bar Swing");const [date,setDate]=useState(new Date().toISOString().slice(0,10));const current=positions.find(p=>canonical(p.ticker)===canonical(ticker));return <div className="modal-bg"><div className="modal"><div className="modal-head"><div><div className="eyebrow">MANUAL UPDATE</div><h2>{action} transaction</h2><p>Updates the current session immediately. Refreshing TRADES reloads the sheet as the source of truth.</p></div><button className="icon-btn" onClick={onClose}>×</button></div><div className="form-grid"><label>Stock<input value={ticker} onChange={(e:any)=>setTicker(e.target.value.toUpperCase())} placeholder="LAURUSLABS"/></label><label>Action<select value={action} onChange={(e:any)=>setAction(e.target.value as "BUY"|"SELL")}><option>BUY</option><option>SELL</option></select></label><label>Quantity<input type="number" min="0" value={qty} onChange={(e:any)=>setQty(e.target.value)}/></label><label>Price<input type="number" min="0" step="0.01" value={price} onChange={(e:any)=>setPrice(e.target.value)}/></label><label>Date<input type="date" value={date} onChange={(e:any)=>setDate(e.target.value)}/></label><label>Strategy<select value={strategy} onChange={(e:any)=>setStrategy(e.target.value)}><option>7Bar Swing</option><option>Long Term</option><option>Personal Pick</option><option>Other</option></select></label></div>{current&&<div className="form-note">Current holding: <b>{current.qty}</b> · invested {money(current.invested)}</div>}{action==="SELL"&&current&&Number(qty)>current.qty&&<div className="error-box">Sell quantity cannot exceed the current holding.</div>}<div className="modal-actions"><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!ticker||Number(qty)<=0||Number(price)<=0||(action==="SELL"&&(!current||Number(qty)>current.qty))} onClick={()=>onSave({id:crypto.randomUUID(),ticker:canonical(ticker),action,qty:Number(qty),price:Number(price),date,strategy})}>{action} & Save</button></div></div></div>}

function manualRealized(base:Position[],txs:Transaction[]){const map=new Map(base.map(p=>[canonical(p.ticker),{qty:p.qty,avg:p.avgBuy}]));let realized=0;for(const t of txs){const k=canonical(t.ticker),p=map.get(k);if(t.action==="BUY"){if(p){const total=p.qty*p.avg+t.qty*t.price;p.qty+=t.qty;p.avg=total/p.qty}else map.set(k,{qty:t.qty,avg:t.price})}else if(p){const q=Math.min(t.qty,p.qty);realized+=q*(t.price-p.avg);p.qty-=q;if(p.qty<=0)map.delete(k)}}return realized}
function applyManual(base:Position[],txs:Transaction[]){const map=new Map(base.map(p=>[canonical(p.ticker),{...p}]));for(const t of txs){const k=canonical(t.ticker),p=map.get(k);if(t.action==="BUY"){if(p){const total=p.invested+t.qty*t.price;const q=p.qty+t.qty;map.set(k,{...p,qty:q,invested:total,avgBuy:total/q,currentValue:p.currentPrice==null?null:q*p.currentPrice,running:p.currentPrice==null?null:q*p.currentPrice-total,runningPct:p.currentPrice==null?null:(q*p.currentPrice-total)/total*100})}else map.set(k,{ticker:k,qty:t.qty,avgBuy:t.price,invested:t.qty*t.price,currentPrice:null,currentValue:null,running:null,runningPct:null,status:"Active",strategy:t.strategy})}else if(p){const q=Math.min(t.qty,p.qty),left=p.qty-q,invLeft=Math.max(0,p.invested-p.avgBuy*q);if(left<=0)map.delete(k);else map.set(k,{...p,qty:left,invested:invLeft,currentValue:p.currentPrice==null?null:left*p.currentPrice,running:p.currentPrice==null?null:left*p.currentPrice-invLeft,runningPct:p.currentPrice==null?null:(left*p.currentPrice-invLeft)/invLeft*100})}}return [...map.values()].filter(p=>p.qty>0)}
function Empty({text}:{text:string}){return <div className="empty">•{text}</div>}
