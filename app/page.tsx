"use client";
import {useEffect,useState} from 'react';
import Metric from '@/components/Metric';
import {actuals,capital} from '@/lib/store';
import {gross,costs,net,modelPnl} from '@/lib/calc';
import {get7BarSnapshot,save7BarSnapshot,modelTradesFromSnapshot} from '@/lib/7bar';

const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);

export default function Home(){
 const[a,setA]=useState<any[]>([]),[m,setM]=useState<any[]>([]),[c,setC]=useState(300000),[sync,setSync]=useState('');
 const refresh=async()=>{try{const r=await fetch('/api/7bar',{cache:'no-store'});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'Sync failed');save7BarSnapshot({active:d.active,closed:d.closed,fetchedAt:d.fetchedAt,total:d.total});setM([...d.active,...d.closed]);setSync(d.fetchedAt)}catch{const s=get7BarSnapshot();if(s){setM(modelTradesFromSnapshot());setSync(s.fetchedAt)}}};
 useEffect(()=>{setA(actuals());setC(capital());const s=get7BarSnapshot();if(s){setM(modelTradesFromSnapshot());setSync(s.fetchedAt)}refresh()},[]);
 const g=a.reduce((s,t)=>s+gross(t),0),co=a.reduce((s,t)=>s+costs(t),0),n=a.reduce((s,t)=>s+net(t),0),mp=m.reduce((s,t)=>s+modelPnl(t,c),0);
 return <><div className="flex items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">Real vs 7Bar</h1><p className="mt-2 text-sm text-zinc-400">Live 7Bar model benchmark vs your actual execution.</p>{sync&&<p className="mt-1 text-xs text-emerald-500">7Bar synced: {new Date(sync).toLocaleString('en-IN')}</p>}</div><button className="primary" onClick={refresh}>Refresh 7Bar</button></div><div className="grid gap-4 md:grid-cols-4 mt-7"><Metric label="Capital" value={money(c)}/><Metric label="7Bar model" value={money(mp)}/><Metric label="Actual gross" value={money(g)}/><Metric label="Actual net" value={money(n)} sub={`Costs: ${money(co)}`}/></div><div className="card mt-6 p-6"><b>Data sources</b><div className="mt-3 grid gap-3 md:grid-cols-3 text-sm text-zinc-400"><div><span className="text-white">7Bar:</span> fetched directly from the public Google Sheet.</div><div><span className="text-white">TRADES:</span> your actual execution data.</div><div><span className="text-white">Broker:</span> costs will be imported separately.</div></div></div><div className="card mt-4 p-6"><b>Core principle</b><p className="mt-2 text-sm text-zinc-400">Never replace actual execution with the theoretical price. If a GTT at ₹3,215 fails and you manually exit at ₹3,171.56, ₹3,171.56 remains the actual result.</p></div></>;
}
