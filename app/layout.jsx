import './globals.css'
import AuthProvider from '@/components/providers/AuthProvider'
import ThemeProvider from '@/components/providers/ThemeProvider'
import CartProvider from '@/components/providers/CartProvider'
import Navbar from '@/components/Layout/Navbar'
import ChatButton from '@/components/UI/ChatButton'
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
    const description = settings?.siteDescription || 'منصة تسوق متكاملة تضمن لك أفضل المنتجات بأفضل الأسعار.';
    const ogImage = settings?.logoUrl || '/og-image.jpg';
    const favicon = settings?.faviconUrl || '/favicon.ico';

    return {
      title: {
        default: `${siteName} | متجر إلكتروني احترافي`,
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
        locale: 'ar_SA',
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
      title: 'NovaCart | متجر إلكتروني احترافي',
      description: 'منصة تسوق متكاملة',
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
              <ChatButton />
              <main>{children}</main>
              <ToastContainer position="bottom-right" />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
