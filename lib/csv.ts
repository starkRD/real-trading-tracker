export function parseCsv(text:string):string[][]{
  const out:string[][]=[]; let row:string[]=[], cell="", quote=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){ if(quote&&text[i+1]==='"'){cell+='"';i++;} else quote=!quote; }
    else if(c===','&&!quote){row.push(cell);cell="";}
    else if((c==='\n'||c==='\r')&&!quote){ if(c==='\r'&&text[i+1]==='\n')i++; row.push(cell);cell="";if(row.some(x=>x.trim()!==""))out.push(row);row=[]; }
    else cell+=c;
  }
  if(cell!==""||row.length){row.push(cell);if(row.some(x=>x.trim()!==""))out.push(row);}
  return out;
}
export function googleCsvUrl(input:string){
  const u=new URL(input); if(u.hostname!=="docs.google.com"||!u.pathname.includes("/spreadsheets/d/"))throw new Error("Use a Google Sheets URL.");
  const m=u.pathname.match(/\/spreadsheets\/d\/([^/]+)/); if(!m)throw new Error("Google Sheet ID not found.");
  const gid=u.searchParams.get("gid")??u.hash.match(/gid=(\d+)/)?.[1]??"0";
  return `https://docs.google.com/spreadsheets/d/${m[1]}/gviz/tq?tqx=out:csv&gid=${encodeURIComponent(gid)}`;
}
