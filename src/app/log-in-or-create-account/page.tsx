"use client"
import * as React from "react"
import { SignIn } from "@clerk/nextjs"

export default function LoginOrCreateAccountPage() {
  return (
    <div className="min-h-dvh w-full flex items-start justify-center">
      <div className="w-full max-w-[880px] px-4 pt-14 pb-10">
        <div className="mb-6">
          <h1 className="text-[36px] leading-[44px] font-semibold text-foreground mb-2">Log in or sign up</h1>
          <p className="text-foreground/70">You’ll get smarter responses and can upload files, images, and more.</p>
        </div>
        <div className="max-w-[520px]">
          <SignIn
            path="/log-in-or-create-account"
            appearance={{
              variables: {
                colorBackground: "var(--bg-primary)",
                colorText: "var(--text-primary)",
                colorTextSecondary: "var(--text-secondary)",
                colorPrimary: "#ffffff",
                colorInputBackground: "var(--bg-secondary)",
                colorInputText: "var(--text-primary)",
                colorInputBorder: "var(--border-default)",
              },
              elements: {
                formButtonPrimary: "bg-white text-black hover:bg-white/90 rounded-full h-10",
                card: "shadow-none bg-transparent border-0 p-0",
                headerSubtitle: "text-foreground/70",
                socialButtonsProviderIcon__apple: "dark:invert-0",
              },
            }}
            afterSignInUrl="/?model=auto"
            signUpUrl="/log-in-or-create-account"
          />
        </div>
      </div>
    </div>
  )
}


