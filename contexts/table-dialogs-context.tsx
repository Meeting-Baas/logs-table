"use client"

import { createContext, useCallback, useMemo, useState } from "react"
import type { FormattedBotData } from "@/components/logs-table/types"
import { ResendWebhookDialog } from "@/components/logs-table/resend-webhook-dialog"
import { ReportErrorDialog } from "@/components/logs-table/report-error-dialog"
import ReportedErrorDialog from "@/components/reported-errors"
import dynamic from "next/dynamic"
// Dynamically import the DebugDialog component for Meeting Baas users and reduce the bundle size for non-Meeting Baas users
const DebugDialog = dynamic(() => import("@/components/debug/debug-dialog"), { ssr: false })

interface TableDialogsContextType {
  resendWebhookDialogState: DialogState
  reportErrorDialogState: DialogState
  reportedErrorDialogState: DialogState
  showResendWebhookDialog: (row: FormattedBotData) => void
  handleResendWebhookDialogChange: (open: boolean) => void
  showReportErrorDialog: (row: FormattedBotData) => void
  handleReportErrorDialogChange: (open: boolean) => void
  showReportedErrorDialog: (row: FormattedBotData, isMeetingBaasUser?: boolean) => void
  handleReportedErrorDialogChange: (open: boolean) => void
  showDebugDialog: (row: FormattedBotData, isMeetingBaasUser?: boolean) => void
  handleDebugDialogChange: (open: boolean) => void
}

type DialogState = {
  open: boolean
  row: FormattedBotData | null
  isMeetingBaasUser?: boolean
}

export const TableDialogsContext = createContext<TableDialogsContextType | undefined>(undefined)

export function TableDialogsProvider({ children }: { children: React.ReactNode }) {
  const initialDialogState: DialogState = useMemo(
    () => ({
      open: false,
      row: null,
      isMeetingBaasUser: undefined
    }),
    []
  )
  const [resendWebhookDialogState, setResendWebhookDialogState] =
    useState<DialogState>(initialDialogState)
  const [reportErrorDialogState, setReportErrorDialogState] =
    useState<DialogState>(initialDialogState)
  const [reportedErrorDialogState, setReportedErrorDialogState] =
    useState<DialogState>(initialDialogState)
  const [debugDialogState, setDebugDialogState] = useState<DialogState>(initialDialogState)

  const showResendWebhookDialog = useCallback((row: FormattedBotData) => {
    setResendWebhookDialogState({
      open: true,
      row
    })
  }, [])

  const handleResendWebhookDialogChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setResendWebhookDialogState(initialDialogState)
      }
    },
    [initialDialogState]
  )

  const showReportErrorDialog = useCallback((row: FormattedBotData) => {
    setReportErrorDialogState({
      open: true,
      row
    })
  }, [])

  const handleReportErrorDialogChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setReportErrorDialogState(initialDialogState)
      }
    },
    [initialDialogState]
  )

  const showReportedErrorDialog = useCallback(
    (row: FormattedBotData, isMeetingBaasUser?: boolean) => {
      setReportedErrorDialogState({
        open: true,
        row,
        isMeetingBaasUser
      })
    },
    []
  )

  const handleReportedErrorDialogChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setReportedErrorDialogState(initialDialogState)
      }
    },
    [initialDialogState]
  )

  const showDebugDialog = useCallback((row: FormattedBotData, isMeetingBaasUser?: boolean) => {
    setDebugDialogState({
      open: true,
      row,
      isMeetingBaasUser
    })
  }, [])

  const handleDebugDialogChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setDebugDialogState(initialDialogState)
      }
    },
    [initialDialogState]
  )

  return (
    <TableDialogsContext.Provider
      value={{
        resendWebhookDialogState,
        reportErrorDialogState,
        reportedErrorDialogState,
        showResendWebhookDialog,
        handleResendWebhookDialogChange,
        showReportErrorDialog,
        handleReportErrorDialogChange,
        showReportedErrorDialog,
        handleReportedErrorDialogChange,
        showDebugDialog,
        handleDebugDialogChange
      }}
    >
      {children}
      <ResendWebhookDialog
        open={resendWebhookDialogState.open}
        onOpenChange={handleResendWebhookDialogChange}
        row={resendWebhookDialogState.row}
      />

      <ReportErrorDialog
        row={reportErrorDialogState.row}
        open={reportErrorDialogState.open}
        onOpenChange={handleReportErrorDialogChange}
      />

      <ReportedErrorDialog
        row={reportedErrorDialogState.row}
        open={reportedErrorDialogState.open}
        onOpenChange={handleReportedErrorDialogChange}
        isMeetingBaasUser={reportedErrorDialogState.isMeetingBaasUser}
      />

      <DebugDialog
        row={debugDialogState.row}
        open={debugDialogState.open}
        onOpenChange={handleDebugDialogChange}
        isMeetingBaasUser={debugDialogState.isMeetingBaasUser}
      />
    </TableDialogsContext.Provider>
  )
}
