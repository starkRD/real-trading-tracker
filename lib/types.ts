export type Position = {
  ticker:string; qty:number; avgBuy:number; invested:number; currentPrice:number|null;
  currentValue:number|null; running:number|null; runningPct:number|null; status:"Active"; strategy:string;
};
export type Transaction = {id:string;ticker:string;action:"BUY"|"SELL";qty:number;price:number;date:string;strategy:string};
export type SevenTrade = {ticker:string;status:string;cmp:number|null;buy:number|null;target:number|null;stop:number|null;positionPct:number|null;bookedPct:number|null;runningPct:number|null};
export type SevenData = {bookedPct:number|null;runningPct:number|null;active:SevenTrade[];closed:string[];syncedAt:string|null};
export type TradesData = {positions:Position[];booked:number;invested:number;value:number;sourceRows:number;syncedAt:string|null};
