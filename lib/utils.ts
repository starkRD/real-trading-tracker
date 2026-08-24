export function norm(x:unknown){return String(x??'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'')}
export function n(x:unknown):number|null{if(x===null||x===undefined||String(x).trim()==='')return null;const v=Number(String(x).replace(/[₹,%\s,]/g,''));return Number.isFinite(v)?v:null}
export function s(x:unknown){return String(x??'').trim()}
export function money(v:number){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(v)}
export function pct(v:number){return `${v>=0?'+':''}${v.toFixed(2)}%`}
export function canonical(ticker:string,aliases:Record<string,string>){let x=norm(ticker);const seen=new Set<string>();while(aliases[x]&&!seen.has(x)){seen.add(x);x=norm(aliases[x])}return x}
export function displayTicker(ticker:string,aliases:Record<string,string>){const x=canonical(ticker,aliases);return x}
