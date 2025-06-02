import { createContext, useState, useEffect, type ReactNode, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BOT_ANALYTICS_URL } from "@/lib/external-urls"

interface PostMessageContextType {
  botUuids: string[]
  setBotUuids: (botUuids: string[]) => void
}

export const PostMessageContext = createContext<PostMessageContextType | undefined>(undefined)

export function PostMessageProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [botUuids, setBotUuids] = useState<string[]>([])
  const windowId = searchParams.get("windowId")
  const fromAnalytics = searchParams.get("from_analytics") === "true"

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== BOT_ANALYTICS_URL) return
      if (event.data?.type === "setBotUuids" && event.data?.windowId === windowId) {
        console.log("Bot UUIDs received from postMessage", event.data.uuids)
        setBotUuids(event.data.uuids)

        // Remove search params from URL
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.delete("from_analytics")
        newSearchParams.delete("windowId")
        router.push(`${window.location.pathname}?${newSearchParams.toString()}`, { scroll: false })

        // Remove event listener after receiving bot UUIDs
        window.removeEventListener("message", handleMessage)
      }
    },
    [windowId, router, searchParams]
  )

  useEffect(() => {
    if (!windowId || !fromAnalytics) return

    // Send ready message to parent window
    window.opener?.postMessage({ type: "ready", windowId }, { targetOrigin: BOT_ANALYTICS_URL })

    // Listen for bot UUIDs from parent window
    if (window.opener) {
      window.addEventListener("message", handleMessage)
    }

    // Clean up after 10 seconds
    const timeout = setTimeout(() => {
      window.removeEventListener("message", handleMessage)
    }, 10000)

    return () => {
      window.removeEventListener("message", handleMessage)
      clearTimeout(timeout)
    }
  }, [windowId, fromAnalytics, handleMessage])

  return (
    <PostMessageContext.Provider value={{ botUuids, setBotUuids }}>
      {children}
    </PostMessageContext.Provider>
  )
}
