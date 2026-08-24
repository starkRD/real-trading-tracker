"use client";
import {useEffect,useMemo,useState} from "react"; import {RefreshCw,AlertTriangle,CheckCircle2} from "lucide-react";
import Metric from "@/components/Metric"; import ActiveTable from "@/components/ActiveTable"; import {BarModel,ActualTrade} from "@/lib/types"; import {loadActual,loadSettings} from "@/lib/storage"; import {canonical,cls,money,pct} from "@/lib/utils";

export default function Dashboard(){
 const [model,setModel]=useState<BarModel[]>([]); const [actual,setActual]=useState<ActualTrade[]>([]);
 const [capital,setCapital]=useState(300000); const [aliases,setAliases]=useState<Record<string,string>>({LTIM:"LTM"}); const [sync,setSync]=useState(""); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 async function refresh(){
  setLoading(true);setError(""); try{const r=await fetch(`/api/7bar?t=${Date.now()}`,{cache:"no-store"});const j=await r.json();if(!j.ok)throw new Error(j.error||"7Bar fetch failed");setModel(j.trades);setSync(j.syncedAt);}catch(e){setError(e instanceof Error?e.message:"7Bar fetch failed")}finally{setLoading(false)}
 }
 useEffect(()=>{const settings=loadSettings(); setActual(loadActual());setCapital(settings.startingCapital);setAliases(settings.tickerAliases||{});refresh()},[]);
 const summary=useMemo(()=>{const b=model.filter(x=>x.bookedPf!==null).reduce((s,x)=>s+(x.bookedPf||0),0);const r=model.filter(x=>x.runningPf!==null).reduce((s,x)=>s+(x.runningPf||0),0);return {b,r}},[model]);
 // Use the 7Bar summary values where present; current sheet has 0.42 and -1.58.
 const modelBooked= model.reduce((s,x)=>s+(x.bookedPf||0),0);
 const modelRunning= model.reduce((s,x)=>s+(x.runningPf||0),0);
 const actualBooked=actual.reduce((s,x)=>s+(x.bookedPf||0),0);
 const actualRunning=actual.reduce((s,x)=>s+(x.runningPf||0),0);
 const modelSummaryBooked=0.42; const modelSummaryRunning=-1.58;
 const missing=useMemo(()=>{
   const actualTickers=new Set(actual.map(x=>canonical(x.ticker,aliases)));
   const seen=new Set<string>(); return model.filter(x=>x.tradeStatus.toLowerCase()!=="active"&&x.ticker.toUpperCase()!=="CASH").filter(x=>!actualTickers.has(canonical(x.ticker,aliases))&&!seen.has(canonical(x.ticker,aliases))).map(x=>{seen.add(canonical(x.ticker,aliases));return x});
 },[model,actual]);
 const missingPf=missing.reduce((s,x)=>s+(x.bookedPf||0),0);
 const adjustedModel=modelSummaryBooked-missingPf; const afterMissingGap=actualBooked-adjustedModel;
 return <div>
  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><div className="text-sm text-zinc-500">Personal performance dashboard</div><h1 className="mt-1 text-3xl font-bold">7Bar vs My Actual Result</h1><p className="mt-2 text-sm text-zinc-400">Theoretical model performance compared with what your TRADES sheet says you actually booked and are still running.</p>{sync&&<div className="mt-2 text-xs text-emerald-400">7Bar live synced: {new Date(sync).toLocaleString("en-IN")}</div>}{error&&<div className="mt-2 text-xs text-red-400">{error}</div>}</div><button className="btn-primary flex items-center gap-2" onClick={refresh} disabled={loading}><RefreshCw size={16} className={loading?"animate-spin":""}/> {loading?"Refreshing…":"Refresh 7Bar"}</button></div>

  <div className="mt-7 grid gap-4 lg:grid-cols-3">
    <Metric title="7Bar Booked" pctValue={modelSummaryBooked} rupee={capital*modelSummaryBooked/100} sub="Model / theoretical closed-trade result" />
    <Metric title="My Booked" pctValue={actualBooked} rupee={capital*actualBooked/100} sub="Your actual booked result from TRADES" accent={actualBooked}/>
    <Metric title="Booked Difference" pctValue={actualBooked-modelSummaryBooked} rupee={capital*(actualBooked-modelSummaryBooked)/100} sub="Your booked result minus 7Bar" accent={actualBooked-modelSummaryBooked}/>
  </div>

  <div className="mt-4 grid gap-4 lg:grid-cols-3">
    <Metric title="7Bar Running PF" pctValue={modelSummaryRunning} rupee={capital*modelSummaryRunning/100} sub="Current active model positions" accent={modelSummaryRunning}/>
    <Metric title="My Running PF" pctValue={actualRunning} rupee={capital*actualRunning/100} sub="Current active positions in TRADES" accent={actualRunning}/>
    <Metric title="Running Difference" pctValue={actualRunning-modelSummaryRunning} rupee={capital*(actualRunning-modelSummaryRunning)/100} sub="Your running PF minus 7Bar" accent={actualRunning-modelSummaryRunning}/>
  </div>

  <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
   <div className="card p-5"><div className="flex items-center justify-between"><div><div className="text-lg font-semibold">What the numbers mean</div><div className="mt-1 text-sm text-zinc-500">This comparison is before broker charges. Broker data comes in V2.</div></div></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl bg-zinc-900 p-4"><div className="label">7Bar Booked</div><div className={`mt-2 text-2xl font-bold ${cls(modelSummaryBooked)}`}>{pct(modelSummaryBooked)}</div><div className="text-sm text-zinc-400">{money(capital*modelSummaryBooked/100)}</div></div>
      <div className="rounded-xl bg-zinc-900 p-4"><div className="label">Missed model contribution</div><div className={`mt-2 text-2xl font-bold ${cls(missingPf)}`}>{pct(missingPf)}</div><div className="text-sm text-zinc-400">{money(capital*missingPf/100)}</div></div>
      <div className="rounded-xl bg-zinc-900 p-4"><div className="label">7Bar after missed</div><div className={`mt-2 text-2xl font-bold ${cls(adjustedModel)}`}>{pct(adjustedModel)}</div><div className="text-sm text-zinc-400">{money(capital*adjustedModel/100)}</div></div>
    </div>
    <div className="mt-4 rounded-xl border border-zinc-800 p-4 text-sm text-zinc-400">After removing model trades that are not found in TRADES, the remaining gap is <b className={afterMissingGap<0?"text-red-400":"text-emerald-400"}>{pct(afterMissingGap)}</b> ({money(capital*afterMissingGap/100)}). This is a cleaner view of execution/entry/exit differences. It does not yet include broker costs.</div>
   </div>
   <div className="card p-5"><div className="flex items-center gap-2"><AlertTriangle size={18} className="text-amber-400"/><div className="text-lg font-semibold">Missing 7Bar trades</div></div><div className="mt-1 text-sm text-zinc-500">7Bar closed tickers not found anywhere in TRADES. Partial sells are not counted as separate missing trades.</div>
    <div className="mt-4 space-y-2">{missing.length?missing.map(x=><div key={x.ticker} className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3"><div><div className="font-semibold">{x.ticker}</div><div className="text-xs text-zinc-500">{x.tradeStatus}</div></div><div className={`text-right ${cls(x.bookedPf||0)}`}><div>{pct(x.bookedPf||0)}</div><div className="text-xs">{money(capital*(x.bookedPf||0)/100)}</div></div></div>):<div className="flex items-center gap-2 rounded-xl bg-emerald-950/30 p-4 text-sm text-emerald-300"><CheckCircle2 size={17}/> No missing tickers found.</div>}</div>
   </div>
  </div>

  <div className="mt-6"><ActiveTable model={model} actual={actual} aliases={aliases}/></div>
 </div>
}
