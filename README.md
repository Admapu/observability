# Admapu Observability

Worker de Cloudflare que consulta el subgraph de Admapu y expone un endpoint `/metrics` con formato compatible con Prometheus.

## Endpoints

- `/health`
- `/metrics`

## Variables de entorno

Definir en `.dev.vars` para desarrollo local:

```bash
GRAPHQL_ENDPOINT=https://api.studio.thegraph.com/query/<subgraph-id>/<subgraph-name>/version/latest
GRAPH_API_KEY=
GRAPH_TIMEOUT_MS=10000
```

Notas:

- `GRAPHQL_ENDPOINT` debe apuntar al endpoint GraphQL exacto del subgraph.
- `GRAPH_API_KEY` es opcional en este scaffold. Si lo defines, el worker la envía como `Authorization: Bearer ...`.
- `GRAPH_TIMEOUT_MS` controla el timeout del fetch al subgraph.

## Desarrollo local

```bash
cp .dev.vars.example .dev.vars
make install
make dev
```

En otra terminal:

```bash
make metrics
```

## Deploy

Autenticarse en Cloudflare con Wrangler y luego:

```bash
make deploy
```

## Métricas expuestas

Globales:

- `admapu_verified_users`
- `admapu_revoked_users`
- `admapu_verification_events_total`
- `admapu_revocation_events_total`
- `admapu_clpc_transfers_total`
- `admapu_clpc_transfer_volume`
- `admapu_clpc_mints_total`
- `admapu_clpc_mint_volume`
- `admapu_clpc_burns_total`
- `admapu_clpc_burn_volume`
- `admapu_clpc_claims_total`
- `admapu_clpc_claim_volume`
- `admapu_gas_spent_wei_total`
- `admapu_gas_spent_eth_total`

Buckets más recientes con label `window="hourly"` o `window="daily"`:

- `admapu_bucket_start_unix`
- `admapu_bucket_verified_events`
- `admapu_bucket_revoked_events`
- `admapu_bucket_net_verified_delta`
- `admapu_bucket_clpc_transfers_total`
- `admapu_bucket_clpc_transfer_volume`
- `admapu_bucket_clpc_mints_total`
- `admapu_bucket_clpc_mint_volume`
- `admapu_bucket_clpc_burns_total`
- `admapu_bucket_clpc_burn_volume`
- `admapu_bucket_clpc_claims_total`
- `admapu_bucket_clpc_claim_volume`
- `admapu_bucket_gas_spent_wei`
- `admapu_bucket_gas_spent_eth`
- `admapu_bucket_verified_users`
- `admapu_bucket_revoked_users`

## Siguiente mejora natural

Agregar cache corta en Worker para reducir presión sobre el endpoint del subgraph cuando haya múltiples scrapers.
