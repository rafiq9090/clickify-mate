# Clickify Mate

Clickify Mate is an AI-powered conversational commerce platform for automating social selling, customer support, and order workflows. It gives businesses a unified dashboard for managing AI agents, catalogs, leads, orders, inboxes, integrations, webhooks, and operational analytics across channels such as Facebook, WhatsApp, Telegram, and Instagram.

## What it provides

- AI-assisted product discovery, price inquiries, and order capture
- Omnichannel messaging and webhook integrations
- Catalog, inventory, lead, order, and payment management
- Hosted payment flows and payment-provider integrations
- Customer feedback, agent logs, and operational dashboards
- PostgreSQL for relational data, MongoDB for chat history, and Redis for queues and cache
- Optional observability with Prometheus, Grafana, Loki, and Promtail
- Optional legacy microservices for orchestration, AI processing, image verification, and webhook cryptography

The broader system design is documented in [`architecture_system_overview_v2.md`](architecture_system_overview_v2.md).

## Architecture

The primary application is a Nuxt 4 full-stack dashboard and API:

```text
Channels and webhooks
          |
          v
Nuxt dashboard/API (apps/dashboard)
     |          |          |
 PostgreSQL   MongoDB     Redis
```

The optional `legacy` Docker Compose profile adds the Go orchestrator, Python AI service, Rust image verifier, and Rust webhook service.

## Prerequisites

- Node.js 22+
- npm
- Docker and Docker Compose
- Git

For local development, create the environment file first:

```bash
cp .env.example .env
```

Replace every required placeholder with a real value. Generate unique, strong secrets for `JWT_SECRET`, `ADMIN_SESSION_SECRET`, `AGENT_ENCRYPTION_KEY`, and `PAYMENT_CREDENTIALS_KEY`. Never commit `.env` or production credentials.

## Quick start

### Run the dashboard locally

```bash
cd apps/dashboard
npm ci
npm run dev
```

The development server is available at <http://localhost:3000>.

### Run the production stack with Docker

```bash
docker compose up -d --build
```

This starts the dashboard and its core dependencies. Check the application health endpoint:

```bash
curl http://localhost:3000/api/status
```

Stop the stack with:

```bash
docker compose down
```

To start the optional legacy services as well:

```bash
docker compose --profile legacy up -d --build
```

## Common commands

From the repository root:

| Command | Description |
| --- | --- |
| `make run-db` | Start PostgreSQL, MongoDB, and Redis |
| `make run-services` | Build and start the Docker Compose services |
| `make run-frontend` | Start the Nuxt development server |
| `make build` | Build the dashboard and legacy Go/Python services |
| `make test-all` | Run backend and frontend verification scripts |
| `make observability-up` | Start Prometheus, Grafana, Loki, and Promtail |
| `make observability-logs` | Follow observability service logs |

Dashboard-only commands:

```bash
cd apps/dashboard
npm run typecheck
npm test
npm run build
```

The test suite covers payment providers, security helpers, RAG, agent dialogue, provider routing, Instagram APIs, and subagents.

## Environment configuration

The root [`.env.example`](.env.example) contains the supported configuration surface, including:

- Database, cache, and authentication settings
- AI provider credentials and model selection
- Telegram, Meta, and other webhook credentials
- Hosted payment and payment-provider settings
- Object storage, email, Supabase, and Firebase integrations
- Admin alerting and observability settings

The application requires secrets at runtime. Docker Compose intentionally fails fast when required values are missing.

## Repository structure

```text
apps/dashboard/       Nuxt dashboard, server routes, and frontend components
services/agent_ai/    Optional Python AI microservice
services/orchestrator/Optional Go ingestion and orchestration service
services/image_verifier/ Optional Rust image/OCR verification service
services/webhook_rust/   Optional Rust webhook and cryptography service
proto/                gRPC service definitions
scripts/              Local verification and database initialization scripts
docs/                 Focused implementation and payment documentation
docker-compose.yml    Local and production service definitions
Makefile              Common development and operations commands
```

## CI/CD

GitHub Actions runs on pushes and pull requests targeting `main`. The validation job:

1. Installs dashboard dependencies with Node.js 22.
2. Runs the dashboard tests.
3. Runs Nuxt type checking.
4. Builds the production dashboard bundle.

On pushes to `main`, the workflow can deploy the dashboard to a configured VPS using `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY`, and optional `VPS_PORT` repository secrets. Without `VPS_HOST`, the deployment step is skipped after validation.

## Security

- Keep all `.env` files and provider credentials out of version control.
- Use separate secrets for development, CI, staging, and production.
- Run the dashboard behind HTTPS and a reverse proxy in production.
- Restrict database and observability ports to trusted networks.
- Rotate credentials immediately if they are exposed.

## License

No license has been published for this repository yet. Contact the repository owner before redistributing or using the code outside its intended project.
