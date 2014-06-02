.PHONY: all build

all: build

build: node_modules

dist: node_modules tools/build.conf.js
	npm run build

# if package.json changes, install
node_modules: package.json
	npm install
	touch $@

test: build
	npm test

clean:
	rm -rf node_modules lib dist

package: dist

run: server

server: build
	npm start

lint: build
	npm run hint

env=dev
deploy: dist
	./node_modules/.bin/lfcdn -e $(env)
