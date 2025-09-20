"use client"
import * as React from "react"
import Link from "next/link"

function getCookie(name: string) {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"))
  return match ? decodeURIComponent(match[1]) : null
}

export function ConsentFooter() {
  const [needsOffset, setNeedsOffset] = React.useState(false)

  React.useEffect(() => {
    // If cookie_consent is not set, cookie banner is visible → add bottom offset
    const accepted = getCookie("cookie_consent")
    setNeedsOffset(!accepted)
  }, [])

  return (
    <div className={`w-full text-center px-4 ${needsOffset ? "pb-[90px]" : "pb-4"}`}>
      <span className="text-sm leading-none text-foreground/60">
        By messaging ChatGPT, you agree to our {" "}
        <Link href="https://openai.com/terms" target="_blank" rel="noreferrer" className="text-foreground underline">Terms</Link>
        {" "}and have read our {" "}
        <Link href="https://openai.com/privacy" target="_blank" rel="noreferrer" className="text-foreground underline">Privacy Policy</Link>
        {" "}. See {" "}
        <Link href="#" className="text-foreground underline">Cookie Preferences</Link>.
      </span>
    </div>
  )
}

export default ConsentFooter


