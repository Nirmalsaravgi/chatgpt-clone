"use client"
import * as React from "react"
import { ComposerBar } from "@/components/ComposerBar"

type Props = { onSubmit?: (q: string) => void }

export function Hero({ onSubmit }: Props) {
  React.useEffect(() => {
    try {
      localStorage.removeItem("ls_chat_started")
      window.dispatchEvent(new Event("ls_chat_started_change"))
      window.dispatchEvent(new Event("chat_reset"))
    } catch {}
  }, [])

  const submit = (value: string) => {
    onSubmit?.(value)
    try {
      localStorage.setItem("ls_chat_started", "1")
      window.dispatchEvent(new Event("ls_chat_started_change"))
      window.dispatchEvent(new Event("chat_started"))
    } catch {}
  }
  return (
    <section className="relative basis-auto shrink flex flex-col items-center justify-center min-h-[62svh] sm:min-h-[64svh] w-full px-[16px] md:px-[24px] lg:px-[32px] pt-5 sm:pt-7 pb-3">
      <div className="flex justify-center">
        <div className="mb-7 hidden text-center sm:block">
          <div className="relative inline-flex justify-center text-center text-2xl leading-9 font-semibold">
            <div>
              <div className="grid-cols-1 items-center justify-end">
                <h1 className="mb-4">ChatGPT</h1>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-token-text-primary mt-[var(--screen-optical-compact-offset-amount,0px)] [display:var(--display-hidden-until-loaded,flex)] w-full shrink flex-col items-center justify-center sm:hidden h-full opacity-100">
        <div className="relative inline-flex justify-center text-center text-2xl leading-9 font-semibold">
          <div>
            <div className="grid-cols-1 items-center justify-end">
              <h1 className="mb-4">ChatGPT</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="text-base mx-auto [--thread-content-margin:--spacing(4)] md:[--thread-content-margin:--spacing(6)] lg:[--thread-content-margin:--spacing(16)] px-[var(--thread-content-margin)] w-full">
        <div className="[--thread-content-max-width:40rem] lg:[--thread-content-max-width:48rem] mx-auto max-w-[var(--thread-content-max-width)] flex-1">
          <ComposerBar onSubmit={submit} />
        </div>
      </div>
    </section>
  )
}

export default Hero


