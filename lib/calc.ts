import {ActualTrade,ModelTrade} from './types';
export const gross=(t:ActualTrade)=>((t.sellQty1||0)*(t.sell1||0)+(t.sellQty2||0)*(t.sell2||0))-(t.qty*t.buy);
export const costs=(t:ActualTrade)=>['brokerage','stt','exchange','sebi','gst','stamp','dp','other'].reduce((s,k)=>s+Number((t as any)[k]||0),0);
export const net=(t:ActualTrade)=>gross(t)-costs(t);
export const modelPnl=(t:ModelTrade,capital:number)=>t.bookedPct!=null?capital*t.bookedPct/100:(t.positionPct&&t.buy&&t.exit?capital*t.positionPct/100*(t.exit/t.buy-1):0);
