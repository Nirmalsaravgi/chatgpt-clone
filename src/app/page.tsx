import { TopNav } from "@/components/TopNav";
import { Landing } from "@/components/Landing";
import { ConsentFooter } from "@/components/ConsentFooter";
import { CookieBanner } from "@/components/CookieBanner";

export default function Home() {
  return (
    <div className="min-h-dvh flex flex-col">
      <TopNav />
      <main className="flex-1 flex items-stretch justify-stretch">
        <Landing />
      </main>
      <ConsentFooter />
      <CookieBanner />
    </div>
  );
}
