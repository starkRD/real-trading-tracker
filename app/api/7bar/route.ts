import {NextResponse} from "next/server";
import {parseCsv} from "@/lib/csv";
import {parseSeven} from "@/lib/parse";
const DEFAULT_URL="https://docs.google.com/spreadsheets/d/1uLyXG-BXWTjQ7secLVmQkSXduO8EaQIHT6GWQQ4Oe4g/edit?gid=2061682406#gid=2061682406";
export async function GET(){try{const u=new URL(DEFAULT_URL);const gid=u.searchParams.get("gid")||"2061682406";const csv=`https://docs.google.com/spreadsheets/d/1uLyXG-BXWTjQ7secLVmQkSXduO8EaQIHT6GWQQ4Oe4g/gviz/tq?tqx=out:csv&gid=${gid}`;const r=await fetch(csv,{cache:"no-store"});const text=await r.text();if(!r.ok)throw new Error(`Google Sheets returned ${r.status}.`);if(/<html|sign in|requested document was not found/i.test(text))throw new Error("The 7Bar sheet is not publicly accessible.");return NextResponse.json(parseSeven(parseCsv(text)));}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"7Bar fetch failed"},{status:400});}}
