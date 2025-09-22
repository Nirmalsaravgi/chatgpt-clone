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
    // Hide while the welcome auth prompt hasn't been dismissed yet
    let welcomeDismissed = true
    try {
      welcomeDismissed = !!localStorage.getItem("dismiss_auth_prompt")
    } catch {}
    setVisible(!accepted && welcomeDismissed)
    const onDismiss = () => setVisible(!getCookie("cookie_consent"))
    window.addEventListener("dismiss_auth_prompt", onDismiss)
    return () => window.removeEventListener("dismiss_auth_prompt", onDismiss)
  }, [])

  const setConsent = (value: string) => {
    if (typeof document === "undefined") return
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    document.cookie = `cookie_consent=${value}; expires=${expires.toUTCString()}; path=/`
    setVisible(false)
    try {
      window.dispatchEvent(new Event("cookie_consent_change"))
    } catch {}
  }

  if (!visible) return null

  return (
    <div id="cookie-banner" className="fixed inset-x-0 bottom-0 z-50">
      <div className="z-10 w-full overflow-hidden">
        {/* Desktop/Tablet bar */}
        <div className="hidden sm:flex bg-[var(--gray-600)] text-foreground w-full flex-col items-center justify-between gap-5 p-5 shadow-sm border-t border-border sm:flex-row sm:gap-0 mx-auto max-w-[1536px]">
          <div className="flex max-w-5xl flex-col gap-2 sm:flex-1">
            <h1 className="text-base">We use cookies</h1>
            <p className="text-sm">
              <span>
                Some cookies are essential for this site to function and cannot be turned off. We also use cookies and collect and share device identifiers to help us understand how our service performs and is used, and to support our marketing efforts. Learn more in our {" "}
                <a className="underline underline-offset-2" href="https://openai.com/policies/cookie-policy/" target="_blank" rel="noreferrer">Cookie Policy</a>. You can update your preferences at any time by clicking ‘<button className="cursor-pointer underline underline-offset-2" onClick={() => setConsent("manage")}>Manage Cookies</button>’.
              </span>
            </p>
          </div>
          <div className="flex w-full flex-row justify-end gap-3 sm:w-auto sm:min-w-[300px]">
            <Button className="h-8 px-4 text-sm rounded-full bg-[var(--bg-primary)] hover:bg-[var(--interactive-bg-tertiary-hover)] text-foreground border border-border" onClick={() => setConsent("manage")}>
              Manage Cookies
            </Button>
            <Button className="h-8 px-4 text-sm rounded-full bg-[var(--bg-primary)] hover:bg-[var(--interactive-bg-tertiary-hover)] text-foreground border border-border" onClick={() => setConsent("reject")}>
              Reject non-essential
            </Button>
            <Button className="h-8 px-4 text-sm rounded-full bg-[var(--bg-primary)] hover:bg-[var(--interactive-bg-tertiary-hover)] text-foreground border border-border" onClick={() => setConsent("accept")}>
              Accept all
            </Button>
          </div>
        </div>

        {/* Mobile dialog-like card */}
        <div className="sm:hidden px-2 pb-2">
          <div className="relative start-1/2 -translate-x-1/2 w-full max-w-[373px] rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.35),0_0_1px_rgba(255,255,255,0.06)_inset,0_0_1px_rgba(255,255,255,0.06)] overflow-hidden bg-[var(--bg-elevated-primary,rgba(0,0,0,0.85))]">
            <div className="flex flex-col items-center justify-center px-5 pt-4 pb-8">
              <p className="mb-2 text-center text-xl font-semibold">We use cookies</p>
              <p className="text-foreground/70 mb-6 text-center text-sm">
                Some cookies are essential for this site to function and cannot be turned off. We also use cookies and collect and share device identifiers to help us understand how our service performs and is used, and to support our marketing efforts. Learn more in our {" "}
                <a className="underline underline-offset-2" href="https://openai.com/policies/cookie-policy/" target="_blank" rel="noreferrer">Cookie Policy</a>. You can update your preferences at any time by clicking ‘<button className="cursor-pointer underline underline-offset-2" onClick={() => setConsent("manage")}>Manage Cookies</button>’.
              </p>
              <Button className="w-full h-10 rounded-full mb-2 border border-border hover:bg-[var(--interactive-bg-secondary-hover)]" onClick={() => setConsent("manage")}>
                Manage Cookies
              </Button>
              <Button className="w-full h-10 rounded-full mb-2 bg-white text-black hover:bg-white/90" onClick={() => setConsent("accept")}>
                Accept all
              </Button>
              <Button className="w-full h-10 rounded-full border border-border hover:bg-[var(--interactive-bg-secondary-hover)]" onClick={() => setConsent("reject")}>
                Reject non-essential
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookieBanner


