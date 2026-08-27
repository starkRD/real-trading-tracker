import {canonical} from "./canonical";
import type {Position,SevenData,SevenTrade,TradesData} from "./types";

export function num(v:unknown):number|null{
  if(v===null||v===undefined||v==="") return null;
  const n=Number(String(v).replace(/[₹,%\s]/g,"").replace(/,/g,""));
  return Number.isFinite(n)?n:null;
}
export function pctNum(v:unknown):number|null{const n=num(v);return n===null?null:n;}

export function parseSeven(rows:string[][]):SevenData{
  const norm=(s:string)=>String(s??"").trim().toLowerCase();
  let booked:number|null=null,running:number|null=null;
  for(let i=0;i<rows.length-1;i++){
    const r=rows[i].map(norm);
    const b=r.findIndex(x=>x==="7bar booked");
    const rr=r.findIndex(x=>x==="7bar running");
    if(b>=0) booked=pctNum(rows[i+1]?.[b]);
    if(rr>=0) running=pctNum(rows[i+1]?.[rr]);
  }
  const activeHeader=rows.findIndex(r=>r.some(c=>norm(c)==="ticker") && r.some(c=>norm(c)==="trade status"));
  const closedMarker=rows.findIndex((r,i)=>i>activeHeader && r.some(c=>norm(c)==="closed trades"));
  const end=closedMarker>0?closedMarker:rows.length;
  const active:SevenTrade[]=[];
  if(activeHeader>=0){
    const h=rows[activeHeader].map(norm);
    const idx=(...names:string[])=>names.map(norm).map(n=>h.indexOf(n)).find(i=>i>=0)??-1;
    const ti=idx("ticker"),si=idx("trade status"),ci=idx("cmp"),bi=idx("buy price"),tar=idx("target"),st=idx("stoploss","stop loss"),pos=idx("position %"),bp=idx("booked pf"),rp=idx("running pf");
    for(let i=activeHeader+1;i<end;i++){
      const row=rows[i]; const ticker=canonical(row[ti]??""); if(!ticker||ticker==="CASH") continue;
      const status=String(row[si]??"").trim(); if(status.toLowerCase()!=="active") continue;
      active.push({ticker,status,cmp:num(row[ci]),buy:num(row[bi]),target:num(row[tar]),stop:num(row[st]),positionPct:pctNum(row[pos]),bookedPct:pctNum(row[bp]),runningPct:pctNum(row[rp])});
    }
  }
  const closed:string[]=[];
  if(closedMarker>=0){
    const hidx=rows.findIndex((r,i)=>i>closedMarker && r.some(c=>norm(c)==="ticker") && r.some(c=>norm(c)==="trade status"));
    if(hidx>=0){const h=rows[hidx].map(norm),ti=h.indexOf("ticker"),si=h.indexOf("trade status");for(let i=hidx+1;i<rows.length;i++){const t=canonical(rows[i][ti]??"");const s=String(rows[i][si]??"").trim().toLowerCase();if(t&&s) closed.push(t);}}
  }
  return {bookedPct:booked,runningPct:running,active,closed,syncedAt:new Date().toISOString()};
}

export function parseTrades(rows:string[][]):TradesData{
  const clean=(s:string)=>String(s??"").trim().toLowerCase().replace(/\s+/g," ");
  const headerIndex=rows.findIndex(r=>r.some(c=>clean(c)==="trade name") && r.some(c=>clean(c)==="trade status"));
  if(headerIndex<0) throw new Error("TRADES sheet header was not found.");
  const h=rows[headerIndex].map(clean);
  const find=(...names:string[])=>names.map(clean).map(n=>h.indexOf(n)).find(i=>i>=0)??-1;
  const ti=find("trade name"),qtyi=find("qty"),buyi=find("buy range"),hi=find("current holding"),alloc=find("current alocation","current allocation"),pricei=find("current price"),vali=find("currnt value","current value"),statusi=find("trade status"),profi=find("profit %"),lossi=find("loss");
  const positions:Position[]=[]; let bookedProfit=0,bookedLoss=0,sourceRows=0;
  for(let i=headerIndex+1;i<rows.length;i++){
    const r=rows[i]; const ticker=canonical(r[ti]??""); if(!ticker) continue; sourceRows++;
    const status=String(r[statusi]??"").trim().toLowerCase();
    const p=num(r[profi]); const l=num(r[lossi]); if(p!==null) bookedProfit+=p; if(l!==null) bookedLoss+=l;
    const holding=num(r[hi])??0; if(status!=="active"||holding<=0) continue;
    const invested=num(r[alloc])??0; const currentValue=num(r[vali]); const currentPrice=num(r[pricei]);
    const avgBuy=holding>0&&invested!==0?invested/holding:(num(r[buyi])??0);
    const running=currentValue===null?null:currentValue-invested;
    positions.push({ticker,qty:holding,avgBuy,invested,currentPrice,currentValue,running,runningPct:invested?((running??0)/invested)*100:null,status:"Active",strategy:"7Bar Swing"});
  }
  return {positions,booked:bookedProfit-bookedLoss,invested:positions.reduce((a,p)=>a+p.invested,0),value:positions.reduce((a,p)=>a+(p.currentValue??0),0),sourceRows,syncedAt:new Date().toISOString()};
}
