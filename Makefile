.PHONY: build run-db stop-db run-services run-frontend test-all test-backend observability-up observability-down observability-logs clean

build:
	cd apps/dashboard && npm run build
	cd services/agent_ai && pip install -r requirements.txt
	cd services/orchestrator && go build -o bin/orchestrator cmd/main.go


run-db:
	docker compose up -d postgres mongodb redis

stop-db:
	docker compose down

run-services:
	docker compose up -d --build

run-frontend:
	npm run dev

test-all: test-backend test-frontend

test-backend:
	chmod +x scripts/test_backend.sh
	./scripts/test_backend.sh

test-frontend:
	chmod +x scripts/test_frontend.sh
	./scripts/test_frontend.sh

observability-up:
	docker compose up -d loki promtail prometheus alertmanager grafana

observability-down:
	docker compose stop loki promtail prometheus alertmanager grafana

observability-logs:
	docker compose logs -f loki promtail prometheus alertmanager grafana

