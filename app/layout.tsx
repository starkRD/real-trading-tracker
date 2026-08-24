import './globals.css';import Sidebar from '@/components/Sidebar';
export const metadata={title:'Real Trading Tracker',description:'7Bar vs actual trading ledger'};
export default function Layout({children}:{children:React.ReactNode}){return <><Sidebar/><main className="min-h-screen md:ml-64"><div className="mx-auto max-w-[1500px] p-5 md:p-8">{children}</div></main></>}
