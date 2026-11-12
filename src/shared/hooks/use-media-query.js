"use client"

import * as React from "react"

export function useMediaQuery(query) {
  const subscribe = React.useCallback(
    (callback) => {
      if (typeof window === "undefined" || !window.matchMedia) {
        return () => {}
      }
      const matchMedia = window.matchMedia(query)
      matchMedia.addEventListener("change", callback)
      return () => matchMedia.removeEventListener("change", callback)
    },
    [query]
  )

  const getSnapshot = () => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false
    }
    return window.matchMedia(query).matches
  }

  const getServerSnapshot = () => false

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
