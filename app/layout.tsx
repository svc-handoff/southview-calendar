import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'South-View | October in History',description:'Explore South-View Cemetery through a calendar of anniversaries, historical stories, and a demonstration walking tour.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
