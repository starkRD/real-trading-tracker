export type Strategy="7Bar Swing"|"Long Term"|"Personal Pick"|"Other";
export type Action="BUY"|"SELL";
export type Tx={id:string;ticker:string;action:Action;qty:number;price:number;date:string;strategy:Strategy};
export type Position={ticker:string;strategy:Strategy;qty:number;avgBuy:number;invested:number;avgSell:number|null;booked:number;cmp:number|null;value:number|null;running:number|null;runningPct:number|null};
export const canonical=(s:string)=>{const x=s.trim().toUpperCase(); const aliases:Record<string,string>={"LTIM":"LTM"}; return aliases[x]||x;};