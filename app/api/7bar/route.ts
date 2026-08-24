import {NextResponse} from 'next/server';
const URL='https://docs.google.com/spreadsheets/d/1uLyXG-BXWTjQ7secLVmQkSXduO8EaQIHT6GWQQ4Oe4g/export?format=csv&gid=2061682406';
export async function GET(){try{const r=await fetch(URL,{cache:'no-store'});if(!r.ok)throw new Error(`Google Sheet returned ${r.status}`);const text=await r.text();return new NextResponse(text,{headers:{'content-type':'text/csv; charset=utf-8','cache-control':'no-store'}})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Failed to fetch 7Bar'},{status:502})}}
