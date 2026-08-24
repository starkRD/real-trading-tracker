export type TradeStatus = 'Active'|'Booked'|'NA'|'Unknown';
export type Transaction = { id:string; ticker:string; action:'BUY'|'SELL'; qty:number; price:number; date:string; strategy:string; source:'manual' };
export type Position = {ticker:string; qty:number; avgBuy:number; invested:number; currentPrice:number|null; currentValue:number|null; running:number|null; runningPct:number|null; status:TradeStatus; strategy:string; sourceRow?:number};
export type ImportedState = {startingCapital:number; historicalBooked:number; historicalProfit:number; historicalLoss:number; activeInvestment:number; currentValue:number; activePositions:Position[]; transactions:Transaction[]; bookedInvestment:number; totalInvested:number; charges:number; importedAt:string; sourceName:string};
export type BarTrade = {ticker:string; status:string; cmp:number|null; buy:number|null; target:number|null; stop:number|null; positionPct:number|null; bookedPct:number|null; runningPct:number|null; date?:string; notes?:string};
export type BarSummary = {bookedPct:number|null; runningPct:number|null};
