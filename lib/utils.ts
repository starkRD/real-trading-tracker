export function n(v:unknown):number|null{
  if(v===null||v===undefined||v==="") return null;
  const x=Number(String(v).replace(/[₹,%\s,]/g,""));
  return Number.isFinite(x)?x:null;
}
export function s(v:unknown):string{return String(v??"").trim();}
export function money(v:number, digits=0){
  return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:digits}).format(v);
}
export function pct(v:number,digits=2){return `${v>=0?"+":""}${v.toFixed(digits)}%`;}
export function cls(v:number){return v>0?"text-emerald-400":v<0?"text-red-400":"text-zinc-300";}
export const DEFAULT_ALIASES:Record<string,string>={LTIM:"LTM"};
export function canonical(t:string, aliases:Record<string,string>={}){
 const x=t.toUpperCase().trim();
 const map={...DEFAULT_ALIASES,...Object.fromEntries(Object.entries(aliases).map(([k,v])=>[k.toUpperCase().trim(),v.toUpperCase().trim()]))};
 return map[x]||x;
}
