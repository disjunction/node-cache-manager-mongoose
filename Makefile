.PHONY: test

default: test

test:
	npx mocha
lint:
	npx eslint
clean:
	rm -rf coverage
coverage:
	npx istanbul cover -i 'src/*.js' --dir coverage ./node_modules/.bin/mocha
coveralls: coverage
ifndef COVERALLS_REPO_TOKEN
	$(error COVERALLS_REPO_TOKEN is undefined)
endif
	npx coveralls < coverage/lcov.info
