SHELL=/bin/bash

env=prod
debug=false
coin=false

.DEFAULT_GOAL := build

clean::
	find . -name "node_modules" -type d -prune -print | xargs du -chs && find . -name 'node_modules' -type d -prune -print -exec rm -rf '{}' \; &&\
	sh scripts/clean.sh

build::
	cd services/bot-base-worker && npm i && npm run docker:push:all

push::
	cd services/rest && npm i && npm run docker:push:all && cd ../.. &&\
	cd services/worker && npm i && npm run docker:push:all

## TODO start application
up::
	echo "todo"
