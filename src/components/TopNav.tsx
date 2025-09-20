import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChatGPTLogo } from "@/components/icons/ChatGPTLogo"
import { HelpCircle } from "lucide-react"

export function TopNav() {
  return (
    <header className="w-full h-[64px] flex items-center">
      <div className="w-full px-[16px] md:px-[24px] lg:px-[32px] flex items-center justify-between">
        <Link href="/" className="text-foreground/80 hover:text-foreground transition-colors">
          <ChatGPTLogo className="size-6" />
        </Link>
        <div className="flex items-center gap-[12px]">
          <Button className="h-9 px-[16px] rounded-full text-sm">
            Log in
          </Button>
          <Button variant="outline" className="h-9 px-[16px] rounded-full text-sm">Sign up for free</Button>
          <Button aria-label="Help" variant="ghost" className="h-9 px-[14px] rounded-full text-sm">
            <HelpCircle className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default TopNav


