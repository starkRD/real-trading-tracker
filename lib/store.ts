import {ActualTrade,ModelTrade} from './types';
const M='rtt_model',A='rtt_actual'; const get=<T,>(k:string,d:T):T=>typeof window==='undefined'?d:JSON.parse(localStorage.getItem(k)||JSON.stringify(d));
export const models=()=>get<ModelTrade[]>(M,[]); export const actuals=()=>get<ActualTrade[]>(A,[]); export const saveModels=(x:ModelTrade[])=>localStorage.setItem(M,JSON.stringify(x)); export const saveActuals=(x:ActualTrade[])=>localStorage.setItem(A,JSON.stringify(x));
export const capital=()=>typeof window==='undefined'?300000:Number(localStorage.getItem('rtt_capital')||300000); export const saveCapital=(n:number)=>localStorage.setItem('rtt_capital',String(n)); export const reset=()=>[M,A,'rtt_capital'].forEach(k=>localStorage.removeItem(k));
