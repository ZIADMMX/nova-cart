import './globals.css'
import Link from 'next/link'
import AuthProvider from '@/components/providers/AuthProvider'
import ThemeProvider from '@/components/providers/ThemeProvider'
import CartProvider from '@/components/providers/CartProvider'
import Navbar from '@/components/Layout/Navbar'
import CartDrawer from '@/components/UI/CartDrawer'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import SiteSettings from '@/model/SiteSettings'
import connectToMongo from '@/lib/db'

export async function generateMetadata() {
  try {
    await connectToMongo();
    let settings = await SiteSettings.findOne({ singleton: "global" }).lean();
    
    const siteName = settings?.siteName || 'NovaCart';
    const description = settings?.siteDescription || 'A comprehensive shopping platform that guarantees you the best products at the best prices.';
    const ogImage = settings?.logoUrl || '/og-image.jpg';
    const favicon = settings?.faviconUrl || '/favicon.ico';

    return {
      title: {
        default: `${siteName} | Professional E-commerce`,
        template: `%s | ${siteName}`,
      },
      description: description,
      icons: {
        icon: favicon,
      },
      openGraph: {
        title: siteName,
        description: description,
        url: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
        siteName: siteName,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: siteName,
          }
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: siteName,
        description: description,
        images: [ogImage],
      }
    };
  } catch (err) {
    return {
      title: 'NovaCart | Professional E-commerce',
      description: 'Comprehensive shopping platform',
    };
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <Navbar />
              <CartDrawer />
              <main>{children}</main>
              <footer className="border-t border-slate-200/70 bg-white/80 py-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400">
                <div className="mx-auto flex flex-wrap items-center justify-center gap-4 px-4">
                  <Link href="/policy" className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400">سياسة الاستبدال والاسترجاع</Link>
                  <span>•</span>
                  <span>Refund Policy • 01286622370</span>
                  <span>•</span>
                  <span>ziad89067@gmail.com</span>
                </div>
              </footer>
              <ToastContainer position="bottom-right" />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
