import { TopNav } from "@/components/TopNav";
import { Landing } from "@/components/Landing";
import { ConsentFooter } from "@/components/ConsentFooter";
import { CookieBanner } from "@/components/CookieBanner";
import WelcomeAuthPrompt from "@/components/WelcomeAuthPrompt";
import { Sidebar } from "@/components/Sidebar";
import { ModelSwitcher } from "@/components/ModelSwitcher";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GptTemporaryChatIcon } from "@/components/icons/GptTemporaryChatIcon";
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="rounded-full p-2 hover:bg-[var(--interactive-bg-secondary-hover)]" aria-label="Turn on temporary chat">
                      <GptTemporaryChatIcon className="size-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6} className="bg-black text-white border-0 px-2 py-1 rounded text-xs">
                    Turn on temporary chat
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
