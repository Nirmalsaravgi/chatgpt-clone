"use client"
import * as React from "react"
import { Hero } from "@/components/Hero"
import { SignedInHero } from "@/components/SignedInHero"
import { SignedIn, SignedOut } from "@clerk/nextjs"
import { Conversation } from "@/components/Conversation"
import { useSearchParams } from "next/navigation"

export function Landing() {
  const [started, setStarted] = React.useState(false)
  const [initialQuery, setInitialQuery] = React.useState<string | null>(null)
  const searchParams = useSearchParams()

  const handleSubmit = (q: string) => {
    setInitialQuery(q)
    setStarted(true)
  }

  React.useEffect(() => {
    // Reset to landing when ?model=auto is present
    const model = searchParams.get("model")
    if (model === "auto") {
      setStarted(false)
      setInitialQuery(null)
    }
  }, [searchParams])

  if (!started) {
    return (
      <>
        <SignedOut>
          <Hero onSubmit={handleSubmit} />
        </SignedOut>
        <SignedIn>
          <SignedInHero onSubmit={handleSubmit} />
        </SignedIn>
      </>
    )
  }

  return <Conversation initialQuery={initialQuery ?? ""} />
}

export default Landing


