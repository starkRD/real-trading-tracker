import "./globals.css"; import Sidebar from "@/components/Sidebar";
export const metadata={title:"Real Trading Tracker",description:"7Bar model vs actual execution"};
export default function RootLayout({children}:{children:React.ReactNode}){return <><Sidebar/><main className="min-h-screen md:ml-64"><div className="mx-auto max-w-7xl p-5 md:p-8">{children}</div></main></>}
