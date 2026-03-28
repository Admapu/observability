interface Env {
  GRAPHQL_ENDPOINT: string;
  GRAPH_API_KEY?: string;
  GRAPH_TIMEOUT_MS?: string;
}

type GraphMetric = {
  currentVerifiedUsers: string;
  currentRevokedUsers: string;
  cumulativeVerificationEvents: string;
  cumulativeRevocationEvents: string;
  clpcTransferCount: string;
  clpcTransferVolume: string;
  clpcMintCount: string;
  clpcMintVolume: string;
  clpcBurnCount: string;
  clpcBurnVolume: string;
  claimCount: string;
  claimVolume: string;
  gasSpentWei: string;
  updatedAt: string;
};

type WindowMetric = {
  bucketStart: string;
  verifiedEvents: string;
  revokedEvents: string;
  netVerifiedDelta: string;
  clpcTransferCount: string;
  clpcTransferVolume: string;
  clpcMintCount: string;
  clpcMintVolume: string;
  clpcBurnCount: string;
  clpcBurnVolume: string;
  claimCount: string;
  claimVolume: string;
  gasSpentWei: string;
  currentVerifiedUsers: string;
  currentRevokedUsers: string;
  updatedAt: string;
};

type GraphResponse = {
  data?: {
    globalMetric: GraphMetric | null;
    hourlyMetrics: WindowMetric[];
    dailyMetrics: WindowMetric[];
  };
  errors?: Array<{ message: string }>;
};

const QUERY = `
  query Metrics {
    globalMetric(id: "current") {
      currentVerifiedUsers
      currentRevokedUsers
      cumulativeVerificationEvents
      cumulativeRevocationEvents
      clpcTransferCount
      clpcTransferVolume
      clpcMintCount
      clpcMintVolume
      clpcBurnCount
      clpcBurnVolume
      claimCount
      claimVolume
      gasSpentWei
      updatedAt
    }
    hourlyMetrics(first: 1, orderBy: bucketStart, orderDirection: desc) {
      bucketStart
      verifiedEvents
      revokedEvents
      netVerifiedDelta
      clpcTransferCount
      clpcTransferVolume
      clpcMintCount
      clpcMintVolume
      clpcBurnCount
      clpcBurnVolume
      claimCount
      claimVolume
      gasSpentWei
      currentVerifiedUsers
      currentRevokedUsers
      updatedAt
    }
    dailyMetrics(first: 1, orderBy: bucketStart, orderDirection: desc) {
      bucketStart
      verifiedEvents
      revokedEvents
      netVerifiedDelta
      clpcTransferCount
      clpcTransferVolume
      clpcMintCount
      clpcMintVolume
      clpcBurnCount
      clpcBurnVolume
      claimCount
      claimVolume
      gasSpentWei
      currentVerifiedUsers
      currentRevokedUsers
      updatedAt
    }
  }
`;

function parseBigInt(value: string | undefined): bigint {
  return BigInt(value ?? "0");
}

function formatMetric(
  name: string,
  help: string,
  type: "gauge" | "counter",
  value: string | bigint | number,
  labels?: Record<string, string>
): string {
  const labelText = labels
    ? `{${Object.entries(labels)
        .map(([key, labelValue]) => `${key}="${labelValue}"`)
        .join(",")}}`
    : "";

  return `# HELP ${name} ${help}
# TYPE ${name} ${type}
${name}${labelText} ${value.toString()}`;
}

function toEthString(wei: bigint): string {
  const divisor = 10n ** 18n;
  const whole = wei / divisor;
  const fraction = wei % divisor;
  const fractionText = fraction.toString().padStart(18, "0").replace(/0+$/, "");
  return fractionText.length > 0 ? `${whole.toString()}.${fractionText}` : whole.toString();
}

function renderGlobalMetrics(metric: GraphMetric): string[] {
  const gasWei = parseBigInt(metric.gasSpentWei);

  return [
    formatMetric("admapu_verified_users", "Current verified users", "gauge", metric.currentVerifiedUsers),
    formatMetric("admapu_revoked_users", "Current revoked users", "gauge", metric.currentRevokedUsers),
    formatMetric(
      "admapu_verification_events_total",
      "Cumulative verification events",
      "counter",
      metric.cumulativeVerificationEvents
    ),
    formatMetric(
      "admapu_revocation_events_total",
      "Cumulative revocation events",
      "counter",
      metric.cumulativeRevocationEvents
    ),
    formatMetric("admapu_clpc_transfers_total", "User to user CLPc transfers", "counter", metric.clpcTransferCount),
    formatMetric("admapu_clpc_transfer_volume", "Transferred CLPc amount in token base units", "counter", metric.clpcTransferVolume),
    formatMetric("admapu_clpc_mints_total", "CLPc mint events detected from ERC20 Transfer", "counter", metric.clpcMintCount),
    formatMetric("admapu_clpc_mint_volume", "Minted CLPc amount in token base units", "counter", metric.clpcMintVolume),
    formatMetric("admapu_clpc_burns_total", "CLPc burn events detected from ERC20 Transfer", "counter", metric.clpcBurnCount),
    formatMetric("admapu_clpc_burn_volume", "Burned CLPc amount in token base units", "counter", metric.clpcBurnVolume),
    formatMetric("admapu_clpc_claims_total", "Successful CLPc claims", "counter", metric.claimCount),
    formatMetric("admapu_clpc_claim_volume", "Claimed CLPc amount in token base units", "counter", metric.claimVolume),
    formatMetric("admapu_gas_spent_wei_total", "Gas spent in wei across indexed transactions", "counter", gasWei),
    formatMetric("admapu_gas_spent_eth_total", "Gas spent in ETH across indexed transactions", "counter", toEthString(gasWei)),
    formatMetric("admapu_metrics_last_updated_unix", "Last global metric update timestamp", "gauge", metric.updatedAt)
  ];
}

function renderWindowMetrics(metric: WindowMetric | undefined, window: "hourly" | "daily"): string[] {
  if (!metric) {
    return [];
  }

  const labels = { window };
  const gasWei = parseBigInt(metric.gasSpentWei);

  return [
    formatMetric("admapu_bucket_start_unix", "Bucket start timestamp", "gauge", metric.bucketStart, labels),
    formatMetric("admapu_bucket_verified_events", "Verification events in the bucket", "gauge", metric.verifiedEvents, labels),
    formatMetric("admapu_bucket_revoked_events", "Revocation events in the bucket", "gauge", metric.revokedEvents, labels),
    formatMetric("admapu_bucket_net_verified_delta", "Net verified delta in the bucket", "gauge", metric.netVerifiedDelta, labels),
    formatMetric("admapu_bucket_clpc_transfers_total", "User to user CLPc transfers in the bucket", "gauge", metric.clpcTransferCount, labels),
    formatMetric("admapu_bucket_clpc_transfer_volume", "Transferred CLPc amount in the bucket, base units", "gauge", metric.clpcTransferVolume, labels),
    formatMetric("admapu_bucket_clpc_mints_total", "CLPc mint events in the bucket", "gauge", metric.clpcMintCount, labels),
    formatMetric("admapu_bucket_clpc_mint_volume", "Minted CLPc amount in the bucket, base units", "gauge", metric.clpcMintVolume, labels),
    formatMetric("admapu_bucket_clpc_burns_total", "CLPc burn events in the bucket", "gauge", metric.clpcBurnCount, labels),
    formatMetric("admapu_bucket_clpc_burn_volume", "Burned CLPc amount in the bucket, base units", "gauge", metric.clpcBurnVolume, labels),
    formatMetric("admapu_bucket_clpc_claims_total", "Claims in the bucket", "gauge", metric.claimCount, labels),
    formatMetric("admapu_bucket_clpc_claim_volume", "Claim volume in the bucket, base units", "gauge", metric.claimVolume, labels),
    formatMetric("admapu_bucket_gas_spent_wei", "Gas spent in the bucket, wei", "gauge", gasWei, labels),
    formatMetric("admapu_bucket_gas_spent_eth", "Gas spent in the bucket, ETH", "gauge", toEthString(gasWei), labels),
    formatMetric("admapu_bucket_verified_users", "Current verified users snapshot at bucket update time", "gauge", metric.currentVerifiedUsers, labels),
    formatMetric("admapu_bucket_revoked_users", "Current revoked users snapshot at bucket update time", "gauge", metric.currentRevokedUsers, labels),
    formatMetric("admapu_bucket_last_updated_unix", "Last bucket update timestamp", "gauge", metric.updatedAt, labels)
  ];
}

async function queryGraph(env: Env): Promise<GraphResponse["data"]> {
  if (!env.GRAPHQL_ENDPOINT) {
    throw new Error("GRAPHQL_ENDPOINT is not configured");
  }

  const timeoutMs = Number(env.GRAPH_TIMEOUT_MS ?? "10000");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const headers: HeadersInit = {
    "content-type": "application/json"
  };

  if (env.GRAPH_API_KEY) {
    headers.authorization = `Bearer ${env.GRAPH_API_KEY}`;
  }

  try {
    const response = await fetch(env.GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: QUERY }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Graph query failed with status ${response.status}`);
    }

    const payload = (await response.json()) as GraphResponse;
    if (payload.errors && payload.errors.length > 0) {
      throw new Error(payload.errors.map((error) => error.message).join("; "));
    }

    if (!payload.data) {
      throw new Error("Graph query returned no data");
    }

    return payload.data;
  } finally {
    clearTimeout(timeout);
  }
}

function renderMetrics(data: NonNullable<GraphResponse["data"]>): string {
  if (!data.globalMetric) {
    throw new Error('Subgraph returned null for globalMetric(id: "current")');
  }

  return [
    ...renderGlobalMetrics(data.globalMetric),
    ...renderWindowMetrics(data.hourlyMetrics[0], "hourly"),
    ...renderWindowMetrics(data.dailyMetrics[0], "daily")
  ].join("\n") + "\n";
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return jsonResponse({ ok: true });
    }

    if (url.pathname !== "/metrics") {
      return jsonResponse(
        {
          ok: false,
          error: "not_found",
          endpoints: ["/health", "/metrics"]
        },
        404
      );
    }

    try {
      const data = await queryGraph(env);
      const metrics = renderMetrics(data);

      return new Response(metrics, {
        status: 200,
        headers: {
          "content-type": "text/plain; version=0.0.4; charset=utf-8"
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_error";
      const body = [
        formatMetric("admapu_scrape_success", "Whether the last scrape succeeded", "gauge", 0),
        formatMetric("admapu_scrape_error", "Always 1 when the scrape failed", "gauge", 1)
      ].join("\n") + `\n# scrape_error_message ${JSON.stringify(message)}\n`;

      return new Response(body, {
        status: 502,
        headers: {
          "content-type": "text/plain; version=0.0.4; charset=utf-8"
        }
      });
    }
  }
};
