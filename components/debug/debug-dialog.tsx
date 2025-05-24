"use client"

import { DebugViewer } from "@/components/debug/debug-viewer"
import { MemoryViewer } from "@/components/debug/memory-viewer"
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
import { useSystemMetrics } from "@/hooks/use-system-metrics"
import { genericError } from "@/lib/errors"
import { getGrafanaLogsUrl } from "@/lib/external-urls"
import { cn } from "@/lib/utils"
import { Download, ExternalLink, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"

interface DebugDialogProps {
  row: FormattedBotData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TabType = "logs" | "memory"

export default function DebugDialog({ row, open, onOpenChange }: DebugDialogProps) {
  const { uuid: bot_uuid } = row || {}
  const [activeTab, setActiveTab] = useState<TabType>("logs")

  const { data: debugData, loading: debugLoading, error: debugError } = useDebugLogs({ bot_uuid })
  const { data: metricsData, loading: metricsLoading, error: metricsError } = useSystemMetrics({ bot_uuid })

  const handleViewGrafanaLogs = () => {
    const url = getGrafanaLogsUrl(bot_uuid)
    window.open(url, "_blank")
  }

  const handleDownloadLogs = () => {
    if (debugData?.logsUrl) {
      window.open(debugData.logsUrl, "_blank")
    }
  }

  const tabs = [
    { id: "logs", label: "Debug Logs", count: null },
    { id: "memory", label: "Memory Metrics", count: metricsData?.metrics?.length || null }
  ] as const

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100svh] max-w-full overflow-y-auto sm:max-h-[90svh] sm:max-w-[82vw]">
        <DialogHeader>
          <DialogTitle>Bot Debug Information</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Bot ID: {bot_uuid}
            <button
              type="button"
              onClick={handleViewGrafanaLogs}
              className="text-xs text-primary hover:underline"
            >
              <ExternalLink className="mr-1 h-3 w-3 inline" />
              View in Grafana
            </button>
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              )}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[60svh]">
          {activeTab === "logs" && (
            <>
              {debugLoading ? (
                <div className="flex h-96 items-center justify-center">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              ) : debugError ? (
                <div className="flex h-96 items-center justify-center text-destructive">
                  Error: {debugError instanceof Error ? debugError.message : genericError}
                </div>
              ) : debugData?.html ? (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <Button
                      onClick={handleDownloadLogs}
                      variant="outline"
                      size="sm"
                      disabled={!debugData?.logsUrl}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Debug Logs
                    </Button>
                  </div>
                  <DebugViewer html={debugData.html} />
                </div>
              ) : (
                <div className="flex h-96 items-center justify-center">No logs found</div>
              )}
            </>
          )}

          {activeTab === "memory" && (
            <>
              {metricsLoading ? (
                <div className="flex h-96 items-center justify-center">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              ) : metricsError ? (
                <div className="flex h-96 items-center justify-center text-destructive">
                  Error: {metricsError instanceof Error ? metricsError.message : genericError}
                </div>
              ) : metricsData?.metrics ? (
                <MemoryViewer metrics={metricsData.metrics} logsUrl={metricsData.logsUrl} />
              ) : (
                <div className="flex h-96 items-center justify-center">No memory metrics found</div>
              )}
            </>
          )}
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
