import {NextResponse} from "next/server";
import {googleCsvUrl,parseCsv} from "@/lib/csv";
import {parseTrades} from "@/lib/parse";
const DEFAULT_URL="https://docs.google.com/spreadsheets/d/1DS_j0bSRdVBlLTND5R4TUHMdTAhk3SbN5AT8SDJma20/edit?gid=0#gid=0";
export async function POST(req:Request){try{const body=await req.json().catch(()=>({}));const url=typeof body.url==="string"&&body.url.trim()?body.url:DEFAULT_URL;const csv=googleCsvUrl(url);const r=await fetch(csv,{cache:"no-store"});const text=await r.text();if(!r.ok)throw new Error(`Google Sheets returned ${r.status}.`);if(/<html|sign in|requested document was not found/i.test(text))throw new Error("TRADES sheet is not publicly accessible. Use Anyone with the link / Viewer.");return NextResponse.json(parseTrades(parseCsv(text)));}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"TRADES fetch failed"},{status:400});}}
