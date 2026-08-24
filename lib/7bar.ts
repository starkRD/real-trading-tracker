import {BarModel} from "./types";
import {n,s} from "./utils";

export const SHEET_ID="1uLyXG-BXWTjQ7secLVmQkSXduO8EaQIHT6GWQQ4Oe4g";
export const SHEET_GID="2061682406";

function rowValues(row:any):string[]{
  return Array.isArray(row?.c) ? row.c.map((x:any)=>String(x?.v??"").trim()) : [];
}
function norm(x:string){return x.toLowerCase().replace(/[^a-z0-9%]/g,"")}
function findHeader(rows:string[][], required:string[]):number{
  const req=required.map(norm);
  for(let i=0;i<Math.min(rows.length,60);i++){
    const r=rows[i].map(norm);
    const score=req.filter(x=>r.some(y=>y===x||y.includes(x))).length;
    if(score>=Math.min(3,required.length)) return i;
  }
  return -1;
}
export function parseGviz(json:any):BarModel[]{
  const rows=(json?.table?.rows||[]).map(rowValues);
  const result:BarModel[]=[];
  // Current 7Bar sheet layout: Active table first, Closed table later.
  const activeHeader=findHeader(rows,["Ticker","Status","CMP","Buy Price","Target","Stoploss","Position %","Trade Status"]);
  const closedHeader=rows.findIndex((r: string[], i: number)=>i>activeHeader && norm(r[0]||"")==="closedtrades");
  function parseSection(header:number, end:number){
    if(header<0)return;
    const h=rows[header].map(norm);
    const idx=(aliases:string[])=>aliases.map(a=>h.indexOf(norm(a))).find(i=>i>=0)??-1;
    const ti=idx(["Ticker"]), si=idx(["Status"]), ci=idx(["CMP"]), bi=idx(["Buy Price"]), tar=idx(["Target"]),
      sli=idx(["Stoploss","Stop Loss"]), pi=idx(["Position %"]), tsi=idx(["Trade Status"]),
      bpi=idx(["Booked PF"]), ri=idx(["Running PF"]), ni=idx(["Remarks"]);
    for(let i=header+1;i<(end<0?rows.length:end);i++){
      const r=rows[i]; const ticker=s(r[ti]);
      if(!ticker||["cash","index calculations","closed trades"].includes(norm(ticker)))continue;
      if(ticker.toLowerCase().includes("alpha")||ticker.toLowerCase().includes("7bar booked"))continue;
      result.push({ticker,status:s(r[si]),cmp:n(r[ci]),buyPrice:n(r[bi]),target:n(r[tar]),stopLoss:n(r[sli]),positionPct:n(r[pi]),tradeStatus:s(r[tsi]),bookedPf:n(r[bpi]),runningPf:n(r[ri]),remarks:s(r[ni])});
    }
  }
  const ch=closedHeader>=0?findHeader(rows.slice(closedHeader+1),["Ticker","CMP","Buy Price","Position %","Trade Status"]):-1;
  const actualClosedHeader=ch>=0?closedHeader+1+ch:-1;
  parseSection(activeHeader,actualClosedHeader);
  parseSection(actualClosedHeader,rows.length);
  return result;
}
