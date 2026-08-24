import * as XLSX from 'xlsx';
import {ImportedState,Position} from './types';
const n=(v:unknown)=>{if(typeof v==='number')return Number.isFinite(v)?v:null;const s=String(v??'').replace(/[,₹%]/g,'').trim();if(!s)return null;const x=Number(s);return Number.isFinite(x)?x:null};
const s=(v:unknown)=>String(v??'').trim();
const norm=(x:string)=>x.toLowerCase().replace(/[^a-z0-9]/g,'');
const find=(r:Record<string,unknown>,names:string[])=>{const keys=Object.keys(r);for(const name of names){const k=keys.find(x=>norm(x)===norm(name));if(k)return r[k]}return undefined};
function date(v:unknown){if(v instanceof Date)return v.toISOString().slice(0,10);const x=s(v);if(!x)return '';const d=new Date(x);return Number.isNaN(d.getTime())?x:d.toISOString().slice(0,10)}
export async function parseWorkbook(file:File):Promise<ImportedState>{
 const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:'array',cellDates:true});
 const tws=wb.Sheets['Trades']; if(!tws)throw new Error('Trades sheet not found');
 const rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(tws,{defval:null});
 const positions:Position[]=[];
 for(let i=0;i<rows.length;i++){
  const r=rows[i];const ticker=s(find(r,['Trade Name','Ticker','Symbol']));if(!ticker)continue;
  const holding=n(find(r,['Current Holding']))||0;const alloc=n(find(r,['Current Alocation','Current Allocation']))||0;const cp=n(find(r,['Current price','Current Price','CMP']));const cv=n(find(r,['Currnt Value','Current Value']));const buy=n(find(r,['Buy Range','Buy Price']))||0;const status=s(find(r,['Trade Status','Status']))||'Unknown';
  if(holding>0 && status.toLowerCase()==='active'){
   const invested=alloc||buy*holding;const value=cv??(cp==null?null:cp*holding);const run=value==null?null:value-invested;positions.push({ticker,qty:holding,avgBuy:holding?invested/holding:buy,invested,currentPrice:cp,currentValue:value,running:run,runningPct:invested&&run!=null?run/invested:null,status:'Active',strategy:'7Bar Swing',sourceRow:i+2});
  }
 }
 const pws=wb.Sheets['P&L'];let totalInvested=0,activeInvestment=positions.reduce((a,p)=>a+p.invested,0),currentValue=positions.reduce((a,p)=>a+(p.currentValue||0),0),profit=0,loss=0,bookedInvestment=0,netProfit=0,charges=0;
 if(pws){const a=XLSX.utils.sheet_to_json<unknown[]>(pws,{header:1,defval:null}); const row4=a[3]||[], row12=a[11]||[], row24=a[23]||[], row32=a[31]||[]; activeInvestment=n(row4[1])??activeInvestment; currentValue=n(row4[4])??currentValue; profit=n(row12[1])||0; loss=n(row12[4])||0; totalInvested=n(row24[1])||0; bookedInvestment=n(row24[3])||0; netProfit=n(row24[4])??(profit-loss); charges=n(row32[1])||0; }
 return {startingCapital:300000,historicalBooked:netProfit,historicalProfit:profit,historicalLoss:loss,activeInvestment,currentValue,activePositions:positions,transactions:[],bookedInvestment,totalInvested,charges,importedAt:new Date().toISOString(),sourceName:file.name};
}
