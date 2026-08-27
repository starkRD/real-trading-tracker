const aliases:Record<string,string> = { LTIM:"LTM" };
export function canonical(value:string){const t=value.trim().toUpperCase().replace(/\s+/g,"");return aliases[t] ?? t;}
