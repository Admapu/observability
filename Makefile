SHELL := /bin/zsh

.PHONY: install dev deploy check metrics

install: ## Install dependencies
	npm install

dev: ## Run in development mode with hot reload
	npx wrangler dev

deploy: ## Deploy to Cloudflare Workers
	npx wrangler deploy

check: ## Check TypeScript types
	npx tsc --noEmit

metrics: ## Show Prometheus metrics
	curl -sS http://127.0.0.1:8787/metrics

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} \
	/^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } \
	/^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
