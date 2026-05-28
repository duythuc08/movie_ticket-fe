import { Navbar } from "@/components/layout/Navbar";
import { FooterConditional } from "@/components/layout/FooterConditional";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <FooterConditional />
    </div>
  );
}
