.PHONY: all build dist

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

lint: build
	npm run lint

# if package.json changes, install
node_modules: package.json
	npm install
	touch $@

package: dist

run: server

server: build
	npm start

test: lint
	npm test
