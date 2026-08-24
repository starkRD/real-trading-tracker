"use client";
import {useState} from "react"; import Papa from "papaparse"; import * as XLSX from "xlsx";
import {ActualTrade} from "@/lib/types"; import {n,s} from "@/lib/utils"; import {saveActual} from "@/lib/storage";
function norm(x:string){return x.toLowerCase().replace(/[^a-z0-9]/g,"")}
function val(r:Record<string,unknown>,names:string[]){const keys=Object.keys(r);for(const name of names){const k=keys.find(x=>norm(x)===norm(name));if(k)return r[k]}return undefined}
function convert(rows:Record<string,unknown>[]):ActualTrade[]{
 const out:ActualTrade[]=[];
 for(let i=0;i<rows.length;i++){
  const r=rows[i];
  const ticker=s(val(r,["Trade Name","Ticker","Symbol"]));
  if(!ticker) continue;
  out.push({
   id:`actual-${Date.now()}-${i}`,
   ticker,
   qty:n(val(r,["QTY","Qty"]))??0,
   buyDate:s(val(r,["Buy Date","Buy Date "])),
   buyPrice:n(val(r,["Buy Range","Buy Price"])),
   target:n(val(r,["Target"])),
   stopLoss:n(val(r,["Stop Loss","Stoploss"])),
   soldAt:n(val(r,["Sold AT","Sold AT "])),
   soldAt2:n(val(r,["SOLD (2nd lot)"])),
   currentHolding:n(val(r,["Current Holding"])),
   profitPct:n(val(r,["Profit %"])),
   loss:n(val(r,["Loss"])),
   currentAllocation:n(val(r,["Current Alocation","Current Allocation"])),
   currentPrice:n(val(r,["Current price","Current Price"])),
   currentValue:n(val(r,["Currnt Value","Current Value"])),
   runningPf:n(val(r,["Running PF"]))??0,
   bookedPf:n(val(r,["PF Booked"]))??0,
   tradeStatus:s(val(r,["Trade Status"])),
   raw:r
  });
 }
 return out;
}
async function read(file:File){const ext=file.name.toLowerCase().split(".").pop();if(ext==="csv"){const text=await file.text();return Papa.parse<Record<string,unknown>>(text,{header:true,skipEmptyLines:true}).data}
 const b=await file.arrayBuffer();const wb=XLSX.read(b,{type:"array"});let out:Record<string,unknown>[]=[];for(const sn of wb.SheetNames){out=out.concat(XLSX.utils.sheet_to_json<Record<string,unknown>>(wb.Sheets[sn],{defval:""}))}return out}
export default function ImportPage(){
 const [msg,setMsg]=useState("");
 async function go(file?:File){if(!file)return;try{const rows=await read(file);const t=convert(rows);saveActual(t);setMsg(`Imported ${t.length} TRADES rows. Dashboard will now use these actual booked/running PF values.`)}catch(e){setMsg(e instanceof Error?e.message:"Import failed")}}
 return <div className="max-w-3xl"><h1 className="text-3xl font-bold">Import your TRADES sheet</h1><p className="mt-2 text-sm text-zinc-400">7Bar is live — no upload needed. Upload only your actual TRADES CSV/XLSX.</p>
 <div className="card mt-6 p-7"><div className="text-lg font-semibold">TRADES</div><div className="mt-2 text-sm text-zinc-500">The importer uses your columns: Trade Name, QTY, Buy Range, Sold AT, Current Holding, Running PF, PF Booked, Trade Status and the other execution fields.</div>
 <label className="btn-primary mt-5 inline-block cursor-pointer">Choose TRADES CSV/XLSX<input className="hidden" type="file" accept=".csv,.xlsx,.xls" onChange={e=>go(e.target.files?.[0])}/></label>
 {msg&&<div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">{msg}</div>}</div>
 <div className="card mt-5 p-6"><div className="font-semibold">Current V2 calculation</div><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-400"><li>Booked PF = sum of your <b className="text-white">PF Booked</b> column.</li><li>Running PF = sum of your <b className="text-white">Running PF</b> column.</li><li>Active holdings are not treated as booked losses.</li><li>Partial sells remain part of the same TRADES row.</li><li>Broker costs are intentionally not included yet.</li></ul></div>
 </div>
}
