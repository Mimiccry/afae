import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";
import SaleBanner from "./SaleBanner";
import ChatWidget from "./ChatWidget";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Navbar />
      <SaleBanner />
      <main className="flex-1 w-full overflow-x-hidden">{children}</main>
      <Footer />
      <ScrollToTop />
      <ChatWidget />
    </div>
  );
};

export default Layout;
