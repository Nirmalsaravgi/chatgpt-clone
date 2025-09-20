import { TopNav } from "@/components/TopNav";
import { Hero } from "@/components/Hero";
import { ConsentFooter } from "@/components/ConsentFooter";
import { CookieBanner } from "@/components/CookieBanner";

export default function Home() {
  return (
    <div className="min-h-dvh flex flex-col">
      <TopNav />
      <main className="flex-1 flex items-center justify-center">
        <Hero />
      </main>
      <ConsentFooter />
      <CookieBanner />
    </div>
  );
}
