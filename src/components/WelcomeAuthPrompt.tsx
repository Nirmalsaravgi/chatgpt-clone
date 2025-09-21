"use client"
import * as React from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs"

export default function WelcomeAuthPrompt() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    try {
      const dismissed = localStorage.getItem("dismiss_auth_prompt")
      if (!dismissed) setOpen(true)
    } catch (_) {
      setOpen(true)
    }
  }, [])

  const stayLoggedOut = () => {
    try {
      localStorage.setItem("dismiss_auth_prompt", "1")
    } catch (_) {}
    setOpen(false)
  }

  return (
    <SignedOut>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[var(--bg-elevated-primary,rgba(0,0,0,0.85))] border border-border p-6 sm:p-8 rounded-[16px] max-w-[560px] text-center">
          <DialogTitle className="text-[28px] sm:text-[30px] leading-8 font-semibold mb-2">Welcome back</DialogTitle>
          <DialogDescription className="text-foreground/80 text-sm sm:text-base mb-6">
            Log in or sign up to get smarter responses, upload files and images, and more.
          </DialogDescription>
          <div className="space-y-3">
            <SignInButton mode="redirect">
              <Button className="w-full h-10 rounded-full bg-white text-black hover:bg-white/90">Log in</Button>
            </SignInButton>
            <SignUpButton mode="redirect">
              <Button variant="outline" className="w-full h-10 rounded-full">Sign up for free</Button>
            </SignUpButton>
          </div>
          <button onClick={stayLoggedOut} className="mt-4 text-sm text-foreground/80 hover:underline">
            Stay logged out
          </button>
        </DialogContent>
      </Dialog>
    </SignedOut>
  )
}


