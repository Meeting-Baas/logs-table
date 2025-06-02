import { fetchDebugLogs } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import AnsiToHtml from "ansi-to-html";
import DOMPurify from "dompurify";

const converter = new AnsiToHtml({
  newline: false, // Manually wrapping lines in <div> tags
});

interface UseDebugLogsParams {
  bot_uuid: string | undefined;
}

interface DebugLogsResponse {
  text: string;
  logsUrl: string;
  html?: string;
}

export function useDebugLogs({ bot_uuid }: UseDebugLogsParams) {
  const { data, isLoading, isError, error, isRefetching } =
    useQuery<DebugLogsResponse>({
      queryKey: [
        "debug-logs",
        {
          bot_uuid,
        },
      ],
      queryFn: () => fetchDebugLogs(bot_uuid || ""),
      enabled: Boolean(bot_uuid),
      select: (data) => {
        const ansiHtml = converter.toHtml(data.text);
        // Split by newlines and wrap each line in a div
        const lines = ansiHtml
          .split("\n")
          .map((line: string) => `<div class="log-line">${line}</div>`)
          .join("");

        const cleanHtml = DOMPurify.sanitize(lines);
        return { ...data, html: cleanHtml };
      },
      retry: false,
      refetchOnWindowFocus: false,
    });

  return {
    data,
    loading: isLoading || isRefetching,
    isError,
    error,
  };
}
