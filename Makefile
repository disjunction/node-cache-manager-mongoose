.PHONY: test 

default: test

test:
	./node_modules/.bin/mocha
lint:
	node_modules/eslint/bin/eslint.js .
