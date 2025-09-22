import { TopNav } from "@/components/TopNav";
import { Landing } from "@/components/Landing";
import { ConsentFooter } from "@/components/ConsentFooter";
import { CookieBanner } from "@/components/CookieBanner";
import WelcomeAuthPrompt from "@/components/WelcomeAuthPrompt";
import { Sidebar } from "@/components/Sidebar";
import { ModelSwitcher } from "@/components/ModelSwitcher";
import TemporaryChatToggle from "@/components/TemporaryChatToggle";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-dvh flex flex-col">
      <SignedOut>
        <TopNav />
      </SignedOut>
      <main className="flex-1 flex items-stretch justify-stretch">
        <SignedIn>
          <Sidebar />
        </SignedIn>
        <div className="flex-1 flex flex-col">
          <SignedIn>
            <div className="sticky top-0 z-10 h-14 flex items-center justify-between px-2 bg-[var(--bg-primary)]">
              <ModelSwitcher />
              <TemporaryChatToggle />
            </div>
          </SignedIn>
          <div className="flex-1">
            <Landing />
          </div>
        </div>
        <SignedOut>
          <WelcomeAuthPrompt />
        </SignedOut>
      </main>
      <SignedOut>
        <ConsentFooter />
        <CookieBanner />
      </SignedOut>
    </div>
  );
}
