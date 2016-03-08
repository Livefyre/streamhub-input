.PHONY: all build dist test

ENV=dev

all: build

build: node_modules

clean:
	rm -rf ./node_modules ./lib ./dist

deploy: dist
	./node_modules/.bin/lfcdn -e $(ENV)

dist: node_modules tools/build.conf.js requirejs.conf.js src/styles/streamhub-input.less
	npm run build

install: build

lint:
	./node_modules/.bin/lfeslint

# if package.json changes, install
node_modules: package.json
	npm install
	touch $@

package: dist

run: server

server: build
	npm start

test: build lint
	./node_modules/karma/bin/karma start tests/karma.conf.js --singleRun --reporters dots
