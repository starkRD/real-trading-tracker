import {NextResponse} from 'next/server';
import {SHEET_GID,SHEET_ID} from '@/lib/7bar';
export const dynamic='force-dynamic';
export async function GET(){try{const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?gid=${SHEET_GID}&tqx=out:json`;const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw new Error(`Google Sheets returned ${res.status}`);const text=await res.text();const start=text.indexOf('{');const end=text.lastIndexOf('}');if(start<0||end<0)throw new Error('Invalid Google Sheets response');const json=JSON.parse(text.slice(start,end+1));return NextResponse.json(json)}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to fetch 7Bar'},{status:500})}}
