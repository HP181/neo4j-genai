// app/layout.js
import './globals.css'
import { Geist } from 'next/font/google'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

// export const metadata = {
//   title: 'Neo4j + GenAI Movie Search',
//   description: 'A demo of using Neo4j with GenAI for movie search',
// }

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}