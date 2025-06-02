import { fetchSoundLogs } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface UseSoundLogsParams {
  bot_uuid: string | undefined;
}

interface SoundLogsResponse {
  soundData: Array<{ timestamp: string; level: number }>;
  logsUrl: string;
}

export function useSoundLogs({ bot_uuid }: UseSoundLogsParams) {
  const { data, isLoading, isError, error, isRefetching } =
    useQuery<SoundLogsResponse>({
      queryKey: [
        "sound-logs",
        {
          bot_uuid,
        },
      ],
      queryFn: () => fetchSoundLogs(bot_uuid || ""),
      enabled: Boolean(bot_uuid),
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
