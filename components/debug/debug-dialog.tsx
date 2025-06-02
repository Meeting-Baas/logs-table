"use client"

import { DebugViewer } from "@/components/debug/debug-viewer"
import { MemoryViewer } from "@/components/debug/memory-viewer"
import { SoundViewer } from "@/components/debug/sound-viewer"
import type { FormattedBotData } from "@/components/logs-table/types"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { useDebugLogs } from "@/hooks/use-debug-logs"
import { useSoundLogs } from "@/hooks/use-sound-logs"
import { useSystemMetrics } from "@/hooks/use-system-metrics"
import { genericError } from "@/lib/errors"
import { AI_CHAT_URL } from "@/lib/external-urls"
import { Download, ExternalLink, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MainTabs } from "@/components/ui/main-tabs"

interface DebugDialogProps {
  row: FormattedBotData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isMeetingBaasUser?: boolean
}

type TabType = "logs" | "memory" | "sound"

interface TabConfig {
  id: TabType
  label: string
  count?: number | null
}

export default function DebugDialog({
  row,
  open,
  onOpenChange,
  isMeetingBaasUser
}: DebugDialogProps) {
  const { uuid: bot_uuid } = row || {}

  // Data hooks
  const { data: debugData, loading: debugLoading, error: debugError } = useDebugLogs({ bot_uuid })
  const {
    data: metricsData,
    loading: metricsLoading,
    error: metricsError
  } = useSystemMetrics({ bot_uuid })
  const { data: soundData, loading: soundLoading, error: soundError } = useSoundLogs({ bot_uuid })

  // Build tabs array after data is available
  const tabs: TabConfig[] = [
    ...(isMeetingBaasUser ? [{ id: "logs" as TabType, label: "Debug Logs", count: null }] : []),
    { id: "memory", label: "Memory Metrics", count: metricsData?.metrics?.length ?? null },
    { id: "sound", label: "Sound Levels", count: soundData?.soundData?.length ?? null }
  ]

  // Set initial tab to the first available tab
  const [activeTab, setActiveTab] = useState<TabType>(tabs[0].id as TabType)

  const handleOpenChat = () => {
    const message = bot_uuid ? `I want to debug bot ${bot_uuid}` : "I want to debug a bot"
    const chatUrl = `${AI_CHAT_URL}?new_chat_message=${encodeURIComponent(message)}`
    window.open(chatUrl, "_blank")
  }

  const handleDownloadLogs = () => {
    if (debugData?.logsUrl) {
      window.open(debugData.logsUrl, "_blank")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100svh] max-w-full overflow-y-auto sm:max-h-[90svh] sm:max-w-[82vw]">
        <DialogHeader>
          <DialogTitle>Bot Debug Information</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Bot ID: {bot_uuid}
            <button
              type="button"
              onClick={handleOpenChat}
              className="text-xs text-primary hover:underline"
            >
              <ExternalLink className="mr-1 h-3 w-3 inline" />
              Open in Chat to debug
            </button>
          </DialogDescription>
        </DialogHeader>

        <MainTabs
          currentTab={activeTab}
          setCurrentTab={(tabId: string) => setActiveTab(tabId as TabType)}
          tabs={tabs}
        />

        {/* Tab Content */}
        <div className="min-h-[60svh]">
          {isMeetingBaasUser &&
            activeTab === "logs" &&
            (debugLoading ? (
              <div className="flex h-96 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : debugError ? (
              <div className="flex h-96 items-center justify-center text-destructive">
                Error: {debugError instanceof Error ? debugError.message : genericError}
              </div>
            ) : debugData?.html ? (
              <div className="space-y-2">
                {isMeetingBaasUser && debugData?.logsUrl && (
                  <div className="flex justify-end">
                    <Button onClick={handleDownloadLogs} variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download Debug Logs
                    </Button>
                  </div>
                )}
                <DebugViewer html={debugData.html} />
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center">No logs found</div>
            ))}

          {activeTab === "memory" &&
            (metricsLoading ? (
              <div className="flex h-96 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : metricsError ? (
              <div className="flex h-96 items-center justify-center text-destructive">
                Error: {metricsError instanceof Error ? metricsError.message : genericError}
              </div>
            ) : metricsData?.metrics ? (
              <MemoryViewer
                metrics={metricsData.metrics}
                logsUrl={isMeetingBaasUser && metricsData.logsUrl ? metricsData.logsUrl : undefined}
              />
            ) : (
              <div className="flex h-96 items-center justify-center">No memory metrics found</div>
            ))}

          {activeTab === "sound" &&
            (soundLoading ? (
              <div className="flex h-96 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : soundError ? (
              <div className="flex h-96 items-center justify-center text-destructive">
                Error: {soundError instanceof Error ? soundError.message : genericError}
              </div>
            ) : soundData?.soundData ? (
              <SoundViewer
                soundData={soundData.soundData}
                logsUrl={isMeetingBaasUser && soundData.logsUrl ? soundData.logsUrl : undefined}
              />
            ) : (
              <div className="flex h-96 items-center justify-center">No sound data found</div>
            ))}
        </div>

        <div className="flex justify-end pt-2">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
