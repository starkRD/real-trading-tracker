import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title:"Real Trading Tracker", description:"7Bar model versus actual trading execution" };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
