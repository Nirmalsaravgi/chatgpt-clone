"use client"
import * as React from "react"
import Link from "next/link"

function getCookie(name: string) {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"))
  return match ? decodeURIComponent(match[1]) : null
}

export function ConsentFooter() {
  const [paddingBottomPx, setPaddingBottomPx] = React.useState<number>(16)
  const [bannerHeight, setBannerHeight] = React.useState<number>(0)
  const [bannerVisible, setBannerVisible] = React.useState<boolean>(false)

  React.useEffect(() => {
    let ro: ResizeObserver | null = null

    const measureAndSet = () => {
      const accepted = getCookie("cookie_consent")
      let welcomeDismissed = true
      try {
        welcomeDismissed = !!localStorage.getItem("dismiss_auth_prompt")
      } catch {}
      const isBannerVisible = !accepted && welcomeDismissed
      setBannerVisible(isBannerVisible)
      if (isBannerVisible) {
        const el = document.getElementById("cookie-banner")
        if (el) {
          const h = Math.ceil(el.getBoundingClientRect().height)
          setBannerHeight(h)
          setPaddingBottomPx(Math.max(16, h))
          return
        }
        // Fallback if element not yet in DOM
        setBannerHeight(90)
        setPaddingBottomPx(90)
        return
      }
      // No banner showing or welcome dialog open → minimal padding
      setPaddingBottomPx(16)
      setBannerHeight(0)
    }

    measureAndSet()

    const onWelcomeDismiss = () => measureAndSet()
    const onCookieChange = () => measureAndSet()
    window.addEventListener("dismiss_auth_prompt", onWelcomeDismiss)
    window.addEventListener("cookie_consent_change", onCookieChange)
    window.addEventListener("resize", measureAndSet)

    const attachObserver = () => {
      const el = document.getElementById("cookie-banner")
      if (el && "ResizeObserver" in window) {
        ro = new ResizeObserver(() => measureAndSet())
        ro.observe(el)
      }
    }

    // Try now and also shortly after to catch mount timing
    attachObserver()
    const t = window.setTimeout(attachObserver, 0)

    return () => {
      window.removeEventListener("dismiss_auth_prompt", onWelcomeDismiss)
      window.removeEventListener("cookie_consent_change", onCookieChange)
      window.removeEventListener("resize", measureAndSet)
      if (ro) ro.disconnect()
      window.clearTimeout(t)
    }
  }, [])

  // When cookie banner visible, fix the footer above it; otherwise keep normal flow
  const fixedProps = bannerVisible
    ? { className: "fixed inset-x-0 z-40 text-center px-4 py-2", style: { bottom: bannerHeight || 90 } as React.CSSProperties }
    : { className: "w-full text-center px-4", style: { paddingBottom: paddingBottomPx } as React.CSSProperties }

  return (
    <div {...fixedProps}>
      <span className="text-sm leading-none">
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


