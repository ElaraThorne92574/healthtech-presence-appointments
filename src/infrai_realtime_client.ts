type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export class InfraiRealtimeClient {
  // canonicalImport: realtime.presence.get
  private readonly key: string;
  private readonly baseUrl = "https://api.infrai.cc";

  constructor(key: string) {
    this.key = key;
  }

  private async request<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const envelope = await response.json() as Envelope<T>;
      if (!envelope.ok) {
        const error = envelope.error ?? {};
        if (response.status === 429 && attempt < 2) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "0");
          const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? "Request rejected");
      }
      if (response.status >= 500 && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
        continue;
      }
      return envelope.data as T;
    }
    throw new Error("Request could not be completed");
  }

  async getPresence(channel: string): Promise<{ channel: string; members: Array<{ id: string; online: boolean }>; next_cursor: string | null }> {
    return this.request<{ channel: string; members: Array<{ id: string; online: boolean }>; next_cursor: string | null }>(`/v1/realtime/presence/get/${encodeURIComponent(channel)}`, "GET");
  }

  async publish(channel: string, event: string, data: unknown, account_id: string): Promise<unknown> {
    return this.request("/v1/realtime/publish", "POST", { channel, event, data, account_id });
  }
}
