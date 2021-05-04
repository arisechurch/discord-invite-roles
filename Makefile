.PHONY: tsc
tsc: clean
	tsc

.PHONY: clean
clean:
	rm -rf dist/
