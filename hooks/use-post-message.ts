import { PostMessageContext } from "@/contexts/post-message-context"
import { useContext } from "react"

export function usePostMessage() {
  const context = useContext(PostMessageContext)
  if (context === undefined) {
    throw new Error("usePostMessage must be used within a PostMessageProvider")
  }
  return context
}
