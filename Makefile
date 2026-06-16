# RRULE Configuration Builder — task runner
# `make up` starts the Vite dev server in the background; `make down` stops it.

PORT     ?= 5180
PID_FILE := .vite.pid
LOG_FILE := .vite.log

.DEFAULT_GOAL := up
.PHONY: up down restart build preview logs status clean

## up: install deps if needed, then start the dev server in the background
up: node_modules
	@if [ -f $(PID_FILE) ] && kill -0 `cat $(PID_FILE)` 2>/dev/null; then \
		echo "Dev server already running (PID `cat $(PID_FILE)`) → http://localhost:$(PORT)"; \
	else \
		nohup ./node_modules/.bin/vite --port $(PORT) --strictPort > $(LOG_FILE) 2>&1 & echo $$! > $(PID_FILE); \
		sleep 1; \
		echo "Dev server started (PID `cat $(PID_FILE)`) → http://localhost:$(PORT)"; \
		echo "Logs: $(LOG_FILE)  (run 'make logs' to follow, 'make down' to stop)"; \
	fi

## down: stop the background dev server
down:
	@if [ -f $(PID_FILE) ]; then \
		PID=`cat $(PID_FILE)`; \
		if kill $$PID 2>/dev/null; then echo "Stopped dev server (PID $$PID)."; \
		else echo "Process $$PID not running."; fi; \
		rm -f $(PID_FILE); \
	else \
		echo "Not tracked as running (no $(PID_FILE)). Try 'make status'."; \
	fi

## restart: stop then start
restart: down up

## status: show whether the dev server is running
status:
	@if [ -f $(PID_FILE) ] && kill -0 `cat $(PID_FILE)` 2>/dev/null; then \
		echo "Running (PID `cat $(PID_FILE)`) → http://localhost:$(PORT)"; \
	else \
		echo "Stopped."; \
	fi

## logs: follow the dev server log
logs:
	@touch $(LOG_FILE) && tail -f $(LOG_FILE)

## build: type-check and produce a production build in dist/
build: node_modules
	npm run build

## preview: serve the production build
preview: build
	npx vite preview --port $(PORT)

## clean: stop the server and remove build output + local artifacts
clean: down
	rm -rf dist node_modules/.vite $(LOG_FILE)

# Install dependencies when package.json is newer than node_modules
node_modules: package.json
	npm install
	@touch node_modules
