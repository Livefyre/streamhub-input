.PHONY: all build test

all: build

build: node_modules

clean:
	rm -rf ./node_modules ./lib ./dist

ENV=dev
deploy: dist
	./node_modules/.bin/lfcdn -e $(ENV)

dist: node_modules tools/build.conf.js requirejs.conf.js src/styles/streamhub-input.less
	npm run build

install: build

lint: build
	npm run hint

# if package.json changes, install
node_modules: package.json
	npm install
	touch $@

package: dist

run: server

server: build
	npm start

test: build
	npm run test
