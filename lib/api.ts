import type {
  BotPaginated,
  BotQueryParams,
  BotSearchParams,
  Screenshot,
  SystemMetrics,
  UserReportedError,
} from "@/components/logs-table/types";

export async function fetchLogs(
  params: BotQueryParams | BotSearchParams
): Promise<BotPaginated> {
  const queryParams =
    "search" in params
      ? new URLSearchParams({
          bot_uuid: params.bot_uuid,
          offset: params.offset.toString(),
          limit: params.limit.toString(),
        })
      : new URLSearchParams({
          offset: params.offset.toString(),
          limit: params.limit.toString(),
          start_date: params.start_date,
          end_date: params.end_date,
          ...(params.meeting_url_contains && {
            meeting_url_contains: params.meeting_url_contains,
          }),
          ...(params.status_type && { status_type: params.status_type }),
          ...(params.user_reported_error_json && {
            user_reported_error_json: params.user_reported_error_json,
          }),
          ...(params.bot_uuid && { bot_uuid: params.bot_uuid }),
        });

  const response = await fetch(`/api/bots/all?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch logs: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export async function retryWebhook(
  bot_uuid: string,
  webhookUrl?: string
): Promise<void> {
  const webhookUrlParam = webhookUrl
    ? `&webhook_url=${encodeURIComponent(webhookUrl)}`
    : "";
  const response = await fetch(
    `/api/bots/retry_webhook?bot_uuid=${bot_uuid}${webhookUrlParam}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to resend webhook: ${response.status} ${response.statusText}`
    );
  }
}

export async function updateError(
  bot_uuid: string,
  note: string,
  status?: UserReportedError["status"]
): Promise<void> {
  // Api requires the bot_uuid to be in the body and in the url
  const response = await fetch(`/api/bots/${bot_uuid}/user_reported_error`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ note, bot_uuid, ...(status && { status }) }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to update error: ${response.status} ${response.statusText}`
    );
  }
}

export async function reportError(
  bot_uuid: string,
  note?: string
): Promise<void> {
  const response = await fetch("/api/report-error", {
    method: "POST",
    body: JSON.stringify({ note, bot_uuid }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to report error: ${response.status} ${response.statusText}`
    );
  }
}

export async function fetchScreenshots(
  bot_uuid: string,
  bots_api_key: string
): Promise<Screenshot[]> {
  const response = await fetch(`/api/bots/${bot_uuid}/screenshots`, {
    headers: {
      "x-meeting-baas-api-key": bots_api_key,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch screenshots: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

interface LogsUrlResponse {
  url: string;
}

export async function fetchSystemMetrics(
  bot_uuid: string
): Promise<{ metrics: SystemMetrics[]; logsUrl: string }> {
  // Input validation
  if (
    !bot_uuid ||
    typeof bot_uuid !== "string" ||
    bot_uuid.trim().length === 0
  ) {
    throw new Error("bot_uuid is required and must be a non-empty string");
  }

  // Fetch the system metrics logs url
  const response = await fetch(`/api/bots/${bot_uuid}/machine_logs`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch system metrics url: ${response.status} ${response.statusText}`
    );
  }

  const responseJson = await response.json();

  // Runtime validation of response structure
  if (!responseJson || typeof responseJson !== "object") {
    throw new Error("Invalid response format: expected an object");
  }

  if (!responseJson.url || typeof responseJson.url !== "string") {
    throw new Error("Invalid response format: missing or invalid url property");
  }

  const logsUrlResponse = responseJson as LogsUrlResponse;

  // Fetch the actual logs file
  const logsResponse = await fetch(logsUrlResponse.url);
  if (!logsResponse.ok) {
    throw new Error(
      `Failed to fetch system metrics logs: ${logsResponse.status} ${logsResponse.statusText}`
    );
  }

  const logsText = await logsResponse.text();

  // Parse the logs into SystemMetrics array
  const metrics: SystemMetrics[] = [];
  const lines = logsText.trim().split("\n");

  for (const line of lines) {
    if (line.trim()) {
      try {
        const parsed = JSON.parse(line) as SystemMetrics;
        metrics.push(parsed);
      } catch (error) {
        console.warn("Failed to parse log line:", line, error);
      }
    }
  }

  return { metrics, logsUrl: logsUrlResponse.url };
}

export async function fetchDebugLogs(
  bot_uuid: string
): Promise<{ text: string; logsUrl: string }> {
  if (!bot_uuid) return { text: "", logsUrl: "" };
  // Fetch the debug logs url
  const logsUrlResponse = await fetch(`/api/bots/${bot_uuid}/logs`);
  if (!logsUrlResponse.ok) {
    throw new Error(
      `Failed to fetch debug logs url: ${logsUrlResponse.status} ${logsUrlResponse.statusText}`
    );
  }
  const logsUrl = (await logsUrlResponse.json()) as LogsUrlResponse;
  if (!logsUrl.url) {
    throw new Error(`Debug logs url not found for bot ${bot_uuid}`);
  }

  // Fetch the debug logs
  const response = await fetch(logsUrl.url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch debug logs: ${response.status} ${response.statusText}`
    );
  }
  const text = await response.text();
  return { text, logsUrl: logsUrl.url };
}

export async function fetchSoundLogs(bot_uuid: string): Promise<{
  soundData: Array<{ timestamp: string; level: number }>;
  logsUrl: string;
}> {
  if (!bot_uuid) return { soundData: [], logsUrl: "" };

  // Fetch the sound logs url
  const logsUrlResponse = await fetch(`/api/bots/${bot_uuid}/sound_logs`);
  if (!logsUrlResponse.ok) {
    throw new Error(
      `Failed to fetch sound logs url: ${logsUrlResponse.status} ${logsUrlResponse.statusText}`
    );
  }
  const logsUrl = (await logsUrlResponse.json()) as LogsUrlResponse;
  if (!logsUrl.url) {
    throw new Error(`Sound logs url not found for bot ${bot_uuid}`);
  }

  // Fetch the sound logs
  const response = await fetch(logsUrl.url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch sound logs: ${response.status} ${response.statusText}`
    );
  }

  const text = await response.text();

  // Parse the CSV-like format into structured data
  const soundData = [];
  const lines = text.trim().split("\n");

  for (const line of lines) {
    if (line.trim()) {
      const [timestampStr, levelStr] = line.split(",");
      if (timestampStr && levelStr) {
        soundData.push({
          timestamp: timestampStr,
          level: parseFloat(levelStr),
        });
      }
    }
  }

  return { soundData, logsUrl: logsUrl.url };
}
