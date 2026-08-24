import {NextResponse} from "next/server";
import {parseGviz,SHEET_GID,SHEET_ID} from "@/lib/7bar";

export const dynamic="force-dynamic";
export async function GET(){
  try{
    const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}&t=${Date.now()}`;
    const res=await fetch(url,{cache:"no-store"});
    if(!res.ok) throw new Error(`Google Sheet returned ${res.status}`);
    const text=await res.text();
    const json=JSON.parse(text.replace(/^[^(]*\(/,"").replace(/\);?\s*$/,""));
    const trades=parseGviz(json);
    return NextResponse.json({ok:true,syncedAt:new Date().toISOString(),trades});
  }catch(e){
    return NextResponse.json({ok:false,error:e instanceof Error?e.message:"Unable to fetch 7Bar"},{status:500});
  }
}
