import { ScrollArea } from "../ui/scroll-area"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useRef } from "react"
import { AlertCircle, Fish, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Button } from "../ui/button"
import type { UserReportedErrorMessage } from "@/components/logs-table/types"
import { useSession } from "@/hooks/use-session"
import { formatCreatedAt } from "@/components/logs-table/column-helpers"
import Link from "next/link"
import { AI_CHAT_URL } from "@/lib/external-urls"

interface ViewMessagesProps {
  messages: UserReportedErrorMessage[]
  retry: (message: UserReportedErrorMessage) => void
}

export const ViewMessages = ({ messages, retry }: ViewMessagesProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const session = useSession()
  const currentUserEmail = session?.user.email

  // biome-ignore lint/correctness/useExhaustiveDependencies: We need to scroll to the bottom of the list when a new messages is added
  useEffect(() => {
    if (scrollRef.current) {
      const scrollableContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      )

      if (scrollableContainer) {
        scrollableContainer.scrollTop = scrollableContainer.scrollHeight
      }
    }
  }, [messages.length])

  // This is a hardcoded note that is used to identify messages that are generated by the system
  // It is appended in the app/api/report-error/route.ts file
  const hardcodedNote = "User reported an error. Additional context:"

  return (
    <ScrollArea ref={scrollRef} className="mb-2 max-h-[50svh] w-full pr-4">
      <AnimatePresence>
        {messages.map((message, index) => {
          const isCurrentUser = message.author === currentUserEmail
          // Skip messages with empty notes (Empty notes are generated by the system when the error is set to in progress)
          if (!message.note.trim()) return null
          return (
            <motion.div
              key={message.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isCurrentUser ? (
                <div className="mb-4 flex items-center gap-2">
                  <div className="ml-auto w-2/3 rounded-md bg-primary p-2 text-primary-foreground">
                    <div className="text-sm">
                      {message.note.startsWith(hardcodedNote)
                        ? message.note.replace(hardcodedNote, "")
                        : message.note}
                    </div>
                    <div className="mt-1 flex justify-end text-xs">
                      {message.status === "pending" ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : message.status === "success" ? (
                        <span className="opacity-70">
                          {formatCreatedAt(message.created_at, message.timezoneCorrection)}
                        </span>
                      ) : (
                        <div>
                          <Button
                            variant="link"
                            className="h-auto p-0 font-semibold text-destructive text-xs"
                            onClick={() => retry(message)}
                          >
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {message.status === "error" && (
                    <AlertCircle className="size-4 stroke-destructive" />
                  )}
                </div>
              ) : (
                <div className="mb-4 flex items-end gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-primary text-primary-foreground capitalize">
                      {message.author.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mr-auto w-2/3 rounded-md bg-secondary p-2 text-secondary-foreground">
                    <div className="mb-1 font-semibold text-primary text-xs">{message.author}</div>
                    <div className="text-sm">{message.note}</div>
                    <div className="mt-1 flex justify-end text-xs opacity-70">
                      {formatCreatedAt(message.created_at, message.timezoneCorrection)}
                    </div>
                  </div>
                </div>
              )}
              {message.chat_id && (
                <div className="mb-4 flex items-end gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-primary text-primary-foreground capitalize">
                      <Fish className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="mr-auto w-2/3 rounded-md bg-secondary p-2 text-secondary-foreground">
                    <div className="mb-1 font-semibold text-primary text-xs">BaaS Chat</div>
                    <div className="text-sm">
                      Your issue has been raised. In the meantime, we have created an AI chat for
                      you to understand the lifecycle of your bot. Click this{" "}
                      <Button variant="link" asChild className="h-auto whitespace-normal p-0">
                        <Link
                          href={`${AI_CHAT_URL}/chat/${message.chat_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          link
                        </Link>
                      </Button>{" "}
                      to open it.
                    </div>
                    <div className="mt-1 flex justify-end text-xs opacity-70">
                      {formatCreatedAt(message.created_at, message.timezoneCorrection)}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </ScrollArea>
  )
}
