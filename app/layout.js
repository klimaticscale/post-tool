import './globals.css'

export const metadata = {
  title: 'LinkedIn Post Builder',
  description: 'AI-powered LinkedIn post generator using the SUCCESs framework',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-zinc-950 text-white">{children}</body>
    </html>
  )
}
