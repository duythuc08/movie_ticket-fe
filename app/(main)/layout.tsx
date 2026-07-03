import { Navbar } from "@/components/layout/Navbar";
import { FooterConditional } from "@/components/layout/FooterConditional";
import { ReviewNotificationBanner } from "@/components/home/components/ReviewNotificationBanner";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <FooterConditional />
      <ReviewNotificationBanner />
    </div>
  );
}
