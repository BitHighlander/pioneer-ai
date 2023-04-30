SHELL := /bin/bash

env=prod
debug=false
coin=false

.DEFAULT_GOAL := build

clean::
	find . -name "node_modules" -type d -prune -print | xargs du -chs && find . -name 'node_modules' -type d -prune -print -exec rm -rf '{}' \; &&\
	sh scripts/clean.sh

build::
	echo lol

push::
	cd services/pioneer-bot && npm i && npm run docker:push:all
	cd services/discord-bridge && npm i && npm run docker:push:all

dev::
	cd services/pioneer-bot && npm i && npm run dev &
	cd services/discord-bridge && npm i && npm run dev &