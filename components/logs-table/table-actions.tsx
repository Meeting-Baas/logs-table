"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { RotateCcw, ExternalLink, Loader2, Image, Logs, Fish } from "lucide-react"
import type { FormattedBotData } from "@/components/logs-table/types"
import { RECORDING_VIEWER_URL } from "@/lib/external-urls"
import { fetchScreenshots } from "@/lib/api"
import { toast } from "sonner"
import { useState } from "react"
import { cn, isMeetingBaasUser } from "@/lib/utils"
import { useScreenshotViewer } from "@/hooks/use-screenshot-viewer"
import { useSession } from "@/hooks/use-session"
import { useTableDialogs } from "@/hooks/use-table-dialogs"

const iconClasses = "size-4"

interface IconButtonProps {
  icon: React.ReactNode
  tooltip: string
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  loading?: boolean
  children?: React.ReactNode
}

function IconButton({ icon, tooltip, onClick, disabled, loading, children }: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-8"
          aria-label={loading ? "Loading..." : tooltip}
          onClick={onClick}
          disabled={disabled || loading}
        >
          {loading ? <Loader2 className={cn(iconClasses, "animate-spin stroke-primary")} /> : icon}
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

interface TableActionsProps {
  row: FormattedBotData
  containerClassName?: string
}

export function TableActions({ row, containerClassName }: TableActionsProps) {
  const [screenshotsLoading, setScreenshotsLoading] = useState(false)
  const {
    showResendWebhookDialog,
    showReportErrorDialog,
    showReportedErrorDialog,
    showDebugDialog
  } = useTableDialogs()
  const { openViewer } = useScreenshotViewer()
  const session = useSession()

  const meetingBaasUser = isMeetingBaasUser(session?.user?.email)

  const handleViewRecording = () => {
    const url = RECORDING_VIEWER_URL.replace(":uuid", row.uuid)
    window.open(url, "_blank")
  }

  const handleResendWebhook = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (row.ended_at) {
      showResendWebhookDialog(row)
    } else {
      toast.error("The meeting hasn't ended yet.")
    }
  }

  const handleReportError = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (row.user_reported_error) {
      showReportedErrorDialog(row, meetingBaasUser)
    } else {
      showReportErrorDialog(row)
    }
  }

  const handleViewScreenshots = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (screenshotsLoading) {
      return
    }

    setScreenshotsLoading(true)
    try {
      const fetchedScreenshots = await fetchScreenshots(row.uuid, session?.user.botsApiKey || "")
      if (fetchedScreenshots.length === 0) {
        toast.warning("No screenshots found.")
        return
      }

      openViewer(fetchedScreenshots)
    } catch {
      toast.error("Failed to fetch screenshots.")
    } finally {
      setScreenshotsLoading(false)
    }
  }

  const handleDebugDialog = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    showDebugDialog(row, meetingBaasUser)
  }

  return (
    <>
      <div className={cn("flex w-full justify-between gap-2", containerClassName)}>
        <IconButton
          icon={<Logs className={iconClasses} />}
          tooltip="Debug bot logs"
          onClick={handleDebugDialog}
        />
        <IconButton
          icon={<RotateCcw className={iconClasses} />}
          tooltip="Resend Final Webhook"
          onClick={handleResendWebhook}
        />
        <IconButton
          icon={<ExternalLink className={iconClasses} />}
          tooltip="View recording"
          onClick={handleViewRecording}
        />
        <IconButton
          icon={
            <Fish
              className={cn(
                iconClasses,
                "stroke-primary",
                row.user_reported_error?.status === "open" && "stroke-amber-500",
                row.user_reported_error?.status === "in_progress" && "stroke-baas-warning-500"
              )}
            />
          }
          tooltip={row.user_reported_error ? "Reported error" : "Report error"}
          onClick={handleReportError}
        >
          {row.user_reported_error && (
            <div
              className={cn(
                "absolute top-0.5 right-1.5 size-2 rounded-full",
                row.user_reported_error.status === "open" && "bg-destructive",
                row.user_reported_error.status === "closed" && "bg-green-500",
                row.user_reported_error.status === "in_progress" && "bg-baas-warning-500"
              )}
            />
          )}
        </IconButton>
        <IconButton
          icon={<Image className={iconClasses} />}
          tooltip="View screenshots"
          onClick={handleViewScreenshots}
          loading={screenshotsLoading}
          disabled={row.platform === "zoom"} // We don't support screenshots for Zoom yet
        />
      </div>
    </>
  )
}
