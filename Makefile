SHELL := /bin/bash

env=prod
debug=false
coin=false

.DEFAULT_GOAL := build

clean::
	find . -name "node_modules" -type d -prune -print | xargs du -chs && find . -name 'node_modules' -type d -prune -print -exec rm -rf '{}' \; &&\
	sh scripts/clean.sh

build:
	cd services/discord-bridge && npm i && npm run build && npx onchange 'src/**/*.ts' -- npm run build
	cd services/pioneer-bot && npm i && npm run build && npx onchange 'src/**/*.ts' -- npm run build
	cd services/openapi-execution-agent && npm i && npm run build && npx onchange 'src/**/*.ts' -- npm run build
	cd services/openapi-skill-creation-agent && npm i && npm run build && npx onchange 'src/**/*.ts' -- npm run build
	cd services/openapi-solver && npm i && npm run build && npx onchange 'src/**/*.ts' -- npm run build
	cd services/openapi-task-queue && npm i && npm run build && npx onchange 'src/**/*.ts' -- npm run build
	cd services/pioneer-ai-rest && npm i && npm run build && npx onchange 'src/**/*.ts' -- npm run build
	cd services/work-delegation-agent && npm i && npm run build && npx onchange 'src/**/*.ts' -- npm run build

push:
	cd services/discord-bridge && npm i && npm run docker:push:all
	cd services/pioneer-bot && npm i && npm run docker:push:all
	cd services/openapi-execution-agent && npm i && npm run docker:push:all
	cd services/openapi-skill-creation-agent && npm i && npm run docker:push:all
	cd services/openapi-solver && npm i && npm run docker:push:all
	cd services/openapi-task-queue && npm i && npm run docker:push:all
	cd services/openapi-ai-rest && npm i && npm run docker:push:all
	cd services/work-delegation-agent && npm i && npm run docker:push:all

dev:
	cd services/discord-bridge && npm i && npm run dev & \
	cd services/pioneer-bot && npm i && npm run dev & \
	cd services/openapi-execution-agent && npm i && npm run dev & \
	cd services/openapi-skill-creation-agent && npm i && npm run dev & \
	cd services/openapi-solver && npm i && npm run dev & \
	cd services/openapi-task-queue && npm i && npm run dev & \
	cd services/pioneer-ai-rest && npm i && npm run dev & \
	cd services/work-delegation-agent && npm i && npm run dev & \
	wait
y