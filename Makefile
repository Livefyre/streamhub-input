.PHONY: all build dist

ENV=dev

all: build

install: build

build: node_modules

dist: node_modules tools/build.conf.js requirejs.conf.js src/styles/streamhub-input.less
	npm run build

# if package.json changes, install
node_modules: package.json
	npm install
	touch $@

test: build lint
	npm test

clean:
	rm -rf ./node_modules ./lib ./dist

package: dist

run: server

server: build
	npm start

lint: build
	npm run lint

deploy: dist
	./node_modules/.bin/lfcdn -e $(ENV)
