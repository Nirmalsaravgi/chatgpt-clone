"use client"
import { SignUp } from "@clerk/nextjs"

export default function Page() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <SignUp afterSignUpUrl="/?model=auto" />
    </div>
  )
}


