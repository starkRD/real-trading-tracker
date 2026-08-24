import "./globals.css"; import Sidebar from "@/components/Sidebar";
export const metadata={title:"Real Trading Tracker",description:"7Bar theoretical vs actual trading performance"};
export default function RootLayout({children}:{children:React.ReactNode}){return <div className="min-h-screen bg-zinc-950"><Sidebar/><main className="min-h-screen md:ml-64"><div className="mx-auto max-w-[1500px] p-5 md:p-8">{children}</div></main></div>}
