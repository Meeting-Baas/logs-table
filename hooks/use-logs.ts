import { useQuery } from "@tanstack/react-query"
import { fetchLogs } from "@/lib/api"
import type { FilterState, FormattedBotData } from "@/components/logs-table/types"
import { getPlatformFromUrl } from "@/lib/format-logs"
import dayjs from "dayjs"
import { usePostMessage } from "./use-post-message"
import { useMemo } from "react"

interface UseLogsParams {
  offset: number
  pageSize: number
  startDate: Date | null
  endDate: Date | null
  filters: FilterState
  botUuids: string[]
}

export function useLogs({
  offset,
  pageSize,
  startDate,
  endDate,
  filters,
  botUuids: initialBotUuids
}: UseLogsParams) {
  const { botUuids: postMessageBotUuids } = usePostMessage()

  // Use bot UUIDs from postMessage if available, otherwise use initial bot UUIDs
  const botUuids = useMemo(
    () => (postMessageBotUuids.length > 0 ? postMessageBotUuids : initialBotUuids),
    [postMessageBotUuids, initialBotUuids]
  )

  const { data, isLoading, isError, error, isRefetching } = useQuery({
    queryKey: [
      "logs",
      {
        offset,
        limit: pageSize,
        startDate,
        endDate,
        filters,
        botUuids
      }
    ],
    queryFn: () => {
      const { platformFilters, statusFilters, userReportedErrorStatusFilters } = filters
      const queryParams = {
        offset,
        limit: pageSize,
        start_date: startDate ? `${dayjs(startDate).format("YYYY-MM-DD")}T00:00:00` : "",
        end_date: endDate ? `${dayjs(endDate).format("YYYY-MM-DD")}T23:59:59` : "",
        ...(botUuids.length > 0 && { bot_uuid: botUuids.join(",") }),
        ...(platformFilters.length > 0 && {
          meeting_url_contains: filters.platformFilters.join(",")
        }),
        ...(statusFilters.length > 0 && { status_type: statusFilters.join(",") }),
        ...(userReportedErrorStatusFilters.length > 0 && {
          user_reported_error_json: `${userReportedErrorStatusFilters.join(",")}`
        })
      }

      return fetchLogs(queryParams)
    },
    select: (data) => {
      const formattedBots: FormattedBotData[] = data.bots.map((bot) => ({
        ...bot,
        platform: getPlatformFromUrl(bot.meeting_url)
      }))

      return {
        has_more: data.has_more,
        bots: formattedBots
      }
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    placeholderData: (previousData) => previousData
  })

  return {
    data,
    isLoading,
    isError,
    error,
    isRefetching
  }
}
