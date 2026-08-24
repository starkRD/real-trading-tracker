import {Settings,Transaction} from './types';
const TK='rtt_transactions_v3', SK='rtt_settings_v3';
export const defaultSettings:Settings={startingCapital:300000,tickerAliases:{LTIM:'LTM'},priceOverrides:{}};
export function loadTransactions():Transaction[]{if(typeof window==='undefined')return [];try{return JSON.parse(localStorage.getItem(TK)||'[]')}catch{return []}}
export function saveTransactions(v:Transaction[]){localStorage.setItem(TK,JSON.stringify(v))}
export function loadSettings():Settings{if(typeof window==='undefined')return defaultSettings;try{const x=JSON.parse(localStorage.getItem(SK)||'{}');return {...defaultSettings,...x,tickerAliases:{...defaultSettings.tickerAliases,...(x.tickerAliases||{})},priceOverrides:{...(x.priceOverrides||{})}}}catch{return defaultSettings}}
export function saveSettings(v:Settings){localStorage.setItem(SK,JSON.stringify(v))}
export function clearAll(){localStorage.removeItem(TK);localStorage.removeItem(SK)}
