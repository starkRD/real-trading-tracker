import {cls,money,pct} from "@/lib/utils";
export default function Metric({title,pctValue,rupee,sub,accent}:{title:string;pctValue?:number;rupee?:number;sub?:string;accent?:number}){
 return <div className="card p-5"><div className="label">{title}</div>
  <div className={`mt-2 text-3xl font-bold ${cls(accent??pctValue??0)}`}>{pctValue===undefined?"—":pct(pctValue)}</div>
  <div className="mt-1 text-base font-semibold">{rupee===undefined?"—":money(rupee)}</div>
  {sub&&<div className="mt-2 text-xs text-zinc-500">{sub}</div>}</div>
}
