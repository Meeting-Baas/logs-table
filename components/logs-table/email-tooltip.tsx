"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"

interface EmailTooltipProps {
  email: string
  botUuid: string
  className?: string
  children: React.ReactNode
}

export const EmailTooltip = ({ email, botUuid, className, children }: EmailTooltipProps) => {
  const searchParams = useSearchParams()
  const handleEmailClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set("bot_uuid", botUuid)
    const embedLink = `${window.location.origin}${window.location.pathname}?${newSearchParams.toString()}`

    const subject = "MeetingBaaS Support"
    const body = `Hi,\n\nI'm contacting you regarding your bot ${botUuid} (${embedLink}).`
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoLink
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleEmailClick}
          aria-label={`Send email to ${email}`}
          title="Click to send an email"
          className={cn("cursor-pointer text-sm hover:opacity-80", className)}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Click to send an email</p>
      </TooltipContent>
    </Tooltip>
  )
}
