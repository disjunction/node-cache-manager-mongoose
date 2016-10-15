.PHONY: test coverage

default: test

test:
	./node_modules/.bin/mocha
lint:
	./node_modules/eslint/bin/eslint.js src
coverage:
	./node_modules/istanbul/lib/cli.js cover \
		-i 'src/*.js' \
		--dir coverage \
		./node_modules/.bin/_mocha
coveralls: coverage
ifndef COVERALLS_REPO_TOKEN
	$(error COVERALLS_REPO_TOKEN is undefined)
endif
	node_modules/coveralls/bin/coveralls.js < coverage/lcov.info
