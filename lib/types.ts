export type BarModel = {
  ticker:string; status:string; cmp:number|null; buyPrice:number|null; target:number|null;
  stopLoss:number|null; positionPct:number|null; tradeStatus:string;
  bookedPf:number|null; runningPf:number|null; remarks:string;
};
export type ActualTrade = {
  id:string; ticker:string; qty:number; buyDate:string; buyPrice:number|null;
  target:number|null; stopLoss:number|null; soldAt:number|null; soldAt2:number|null;
  currentHolding:number|null; profitPct:number|null; loss:number|null;
  currentAllocation:number|null; currentPrice:number|null; currentValue:number|null;
  runningPf:number; bookedPf:number; tradeStatus:string; raw?:Record<string,unknown>;
};
export type Settings={startingCapital:number; tickerAliases:Record<string,string>};
