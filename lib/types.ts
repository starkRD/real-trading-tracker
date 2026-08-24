export type Action='BUY'|'SELL';
export type Strategy='7Bar Swing'|'Long Term'|'Personal Pick'|'Other';
export type Transaction={id:string;ticker:string;action:Action;qty:number;price:number;date:string;strategy:Strategy;source:'manual'|'import';note?:string};
export type Position={ticker:string;strategy:Strategy;qty:number;avgBuy:number;invested:number;avgSell:number;realized:number;currentPrice:number|null;marketValue:number;running:number;runningPct:number};
export type BarModel={ticker:string;status:string;cmp:number|null;buyPrice:number|null;target:number|null;stopLoss:number|null;positionPct:number|null;tradeStatus:string;bookedPf:number|null;runningPf:number|null;remarks:string;section:'active'|'closed'};
export type BarSnapshot={models:BarModel[];bookedPf:number;runningPf:number;fetchedAt:string;activeCount:number;closedCount:number};
export type Settings={startingCapital:number;tickerAliases:Record<string,string>;priceOverrides:Record<string,number>};
