"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"

function getCookie(name: string) {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"))
  return match ? decodeURIComponent(match[1]) : null
}

export function CookieBanner() {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const accepted = getCookie("cookie_consent")
    setVisible(!accepted)
  }, [])

  const setConsent = (value: string) => {
    if (typeof document === "undefined") return
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    document.cookie = `cookie_consent=${value}; expires=${expires.toUTCString()}; path=/`
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="px-[16px] md:px-[24px] lg:px-[32px] pb-4">
        <div className="rounded-[14px] bg-secondary text-secondary-foreground p-4 shadow-lg border border-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-foreground/80">
              We use cookies and similar technologies to understand performance and deliver a better experience. You can update preferences at any time.
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-full h-8 px-4 text-xs" onClick={() => setConsent("manage")}>Manage Cookies</Button>
              <Button variant="outline" className="rounded-full h-8 px-4 text-xs" onClick={() => setConsent("reject")}>Reject non-essential</Button>
              <Button className="rounded-full h-8 px-4 text-xs" onClick={() => setConsent("accept")}>Accept all</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookieBanner


