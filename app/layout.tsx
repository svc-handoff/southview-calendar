import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'South-View Calendar & Timeline',description:'Browse South-View Cemetery history by month and follow the October timeline.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
