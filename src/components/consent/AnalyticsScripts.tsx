"use client"

import { useSyncExternalStore } from "react"
import Script from "next/script"
import {
  CONSENT_EVENT,
  CONSENT_STORAGE_KEY,
  parseConsent,
} from "@/lib/consent"

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(CONSENT_EVENT, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(CONSENT_EVENT, callback)
  }
}

function getSnapshot() {
  return localStorage.getItem(CONSENT_STORAGE_KEY)
}

export function AnalyticsScripts() {
  const rawConsent = useSyncExternalStore(subscribe, getSnapshot, () => null)
  const consent = parseConsent(rawConsent)

  if (process.env.NODE_ENV !== "production" || !consent?.analytics) return null

  return (
    <>
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-NQS3PK8S');`}
      </Script>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-WY07TY58R1"
        strategy="afterInteractive"
      />
      <Script id="ga" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('consent','update',{'analytics_storage':'granted'});gtag('config','G-WY07TY58R1');`}
      </Script>
      <Script
        defer
        data-domain="ecomed.eco.br"
        src="https://plausible.io/js/script.js"
        strategy="afterInteractive"
      />
    </>
  )
}
