.PHONY: tsc
tsc: clean
	./node_modules/.bin/tsc

.PHONY: clean
clean:
	rm -rf dist/
