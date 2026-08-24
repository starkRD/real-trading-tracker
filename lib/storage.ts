import {ActualTrade,Settings} from "./types";
const AK="rtt_actual_v2", SK="rtt_settings_v2";
export const defaultSettings:Settings={startingCapital:300000,tickerAliases:{LTIM:"LTM"}};
export function loadActual():ActualTrade[]{
 if(typeof window==="undefined") return [];
 try{return JSON.parse(localStorage.getItem(AK)||"[]")}catch{return []}
}
export function saveActual(v:ActualTrade[]){localStorage.setItem(AK,JSON.stringify(v))}
export function loadSettings():Settings{
 if(typeof window==="undefined") return defaultSettings;
 try{return {...defaultSettings,...JSON.parse(localStorage.getItem(SK)||"{}")}}catch{return defaultSettings}
}
export function saveSettings(v:Settings){localStorage.setItem(SK,JSON.stringify(v))}
export function clearActual(){localStorage.removeItem(AK)}
