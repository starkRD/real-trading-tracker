"use client";
import Link from "next/link"; import {usePathname} from "next/navigation";
import {BarChart3,ListChecks,GitCompare,Upload,Settings} from "lucide-react";
const links=[["/","Dashboard",BarChart3],["/trades","Actual Trades",ListChecks],["/reconcile","Reconcile",GitCompare],["/import","Import TRADES",Upload],["/settings","Settings",Settings]] as const;
export default function Sidebar(){
 const p=usePathname(); return <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-zinc-800 bg-zinc-950 p-5 md:block">
  <div className="mb-8"><div className="text-lg font-bold">Real Trading Tracker</div><div className="mt-1 text-xs text-zinc-500">7Bar vs your real execution</div></div>
  <nav className="space-y-1">{links.map(([href,label,Icon])=><Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${p===href?"bg-zinc-800 text-white":"text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}><Icon size={17}/>{label}</Link>)}</nav>
  <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-zinc-800 p-3 text-xs text-zinc-500">V2: model, actual and reconciliation. Broker costs come next.</div>
 </aside>
}
