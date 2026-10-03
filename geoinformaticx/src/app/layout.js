import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar/nav";
import Footer from "@/components/footer/footer";
import Toast from "@/components/toast/toast";
import SplashScreen from "@/components/splash/SplashScreen";
import ScrollToTop from "@/components/ScrollToTop";
import PageTransitionLoader from "@/components/PageTransitionLoader";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Geoinformaticx",
  description: "Discover. Support. Grow Local.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh", margin: 0 }}>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
        <SplashScreen />
        <ScrollToTop />
        <PageTransitionLoader />
        <Navbar />
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <Footer />
        <Toast />
      </body>
    </html>
  );
}