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
    try {
      window.dispatchEvent(new CustomEvent("dismiss_auth_prompt"))
    } catch {}
  }

  return (
    <SignedOut>
      <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          showCloseButton={false}
          className="bg-[var(--bg-elevated-primary,rgba(0,0,0,0.85))] border-0 rounded-2xl max-w-[400px] sm:max-w-[400px] text-center shadow-[0_8px_16px_rgba(0,0,0,0.35),0_0_1px_rgba(255,255,255,0.06)_inset,0_0_1px_rgba(255,255,255,0.06)] p-0 top-auto bottom-[4px] left-1/2 -translate-x-1/2 translate-y-0 w-[calc(100%-16px)] sm:w-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:translate-y-[-50%]"
        >
          <div className="flex flex-col items-center justify-center px-6 py-8 sm:p-10">
            <DialogTitle className="text-2xl font-semibold mb-1">Welcome back</DialogTitle>
            <DialogDescription className="text-foreground/80 text-lg mb-6">
              Log in or sign up to get smarter responses, upload files and images, and more.
            </DialogDescription>
            <div className="w-full">
              <SignInButton mode="redirect">
                <Button className="w-full h-10 rounded-full bg-white text-black hover:bg-white/90 mb-2 sm:mb-3">Log in</Button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <Button variant="outline" className="w-full h-10 rounded-full mb-5">Sign up for free</Button>
              </SignUpButton>
            </div>
            <button onClick={stayLoggedOut} className="text-foreground/80 font-semibold underline sm:text-sm">
              Stay logged out
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </SignedOut>
  )
}


