"use client";
import {useEffect,useState} from "react";
import {clearActual,loadSettings,saveSettings} from "@/lib/storage";

export default function Settings(){
 const [c,setC]=useState("300000");
 const [aliases,setAliases]=useState<Record<string,string>>({LTIM:"LTM"});
 const [oldSymbol,setOldSymbol]=useState(""); const [newSymbol,setNewSymbol]=useState("");
 useEffect(()=>{const s=loadSettings();setC(String(s.startingCapital));setAliases(s.tickerAliases||{LTIM:"LTM"})},[]);
 function save(nextAliases=aliases){saveSettings({startingCapital:Number(c)||0,tickerAliases:nextAliases});setAliases(nextAliases)}
 function addAlias(){const old=oldSymbol.trim().toUpperCase(), next=newSymbol.trim().toUpperCase();if(!old||!next||old===next)return;const nextAliases={...aliases,[old]:next};save(nextAliases);setOldSymbol("");setNewSymbol("")}
 function removeAlias(k:string){const next={...aliases};delete next[k];save(next)}
 return <div className="max-w-2xl"><h1 className="text-3xl font-bold">Settings</h1><p className="mt-2 text-sm text-zinc-400">Capital and ticker-name history used when matching 7Bar with your TRADES.</p>
 <div className="card mt-6 p-6"><div className="label">Starting capital</div><input className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3" value={c} onChange={e=>setC(e.target.value)}/><button className="btn-primary mt-4" onClick={()=>save()}>Save</button></div>
 <div className="card mt-5 p-6"><div className="font-semibold">Stock symbol changes</div><p className="mt-2 text-sm text-zinc-500">If a stock changes its NSE trading symbol, add the old symbol and new symbol here. The tracker will treat them as the same stock for matching and comparison.</p>
 <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]"><input className="rounded-xl border border-zinc-700 bg-zinc-900 p-3" placeholder="Old symbol e.g. LTIM" value={oldSymbol} onChange={e=>setOldSymbol(e.target.value)}/><input className="rounded-xl border border-zinc-700 bg-zinc-900 p-3" placeholder="New symbol e.g. LTM" value={newSymbol} onChange={e=>setNewSymbol(e.target.value)}/><button className="btn-primary" onClick={addAlias}>Add</button></div>
 <div className="mt-5 space-y-2">{Object.entries(aliases).map(([oldSym,newSym])=><div key={oldSym} className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3"><div className="text-sm"><b>{oldSym}</b><span className="mx-2 text-zinc-600">→</span><b>{newSym}</b><div className="text-xs text-zinc-500">Matched as one stock</div></div><button className="btn" onClick={()=>removeAlias(oldSym)}>Remove</button></div>)}</div></div>
 <div className="card mt-5 p-6"><div className="font-semibold">Reset actual TRADES</div><button className="btn mt-4" onClick={()=>{clearActual();location.reload()}}>Clear imported TRADES</button></div></div>
}
