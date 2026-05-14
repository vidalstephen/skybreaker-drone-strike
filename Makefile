# Makefile for skybreaker-drone-strike
# Usage: make <target> [MSG="your commit message"] [BRANCH=branch-name]

REMOTE   ?= origin
BRANCH   ?= $(shell git rev-parse --abbrev-ref HEAD)
MSG      ?= $(shell date '+chore: update %Y-%m-%d %H:%M')

.PHONY: help status stage commit push sync save

## help: show this help message
help:
	@grep -E '^## ' Makefile | sed 's/^## //'

## status: show working tree status
status:
	git status

## stage: stage all changes (git add -A)
stage:
	git add -A
	@echo "Staged:"
	git status --short

## commit: stage all changes and commit with MSG
commit:
	git add -A
	git commit -m "$(MSG)"

## push: push current branch to remote
push:
	git push $(REMOTE) $(BRANCH)

## sync: stage, commit, and push in one step  (use MSG="..." to set message)
sync:
	git add -A
	git commit -m "$(MSG)"
	git push $(REMOTE) $(BRANCH)

## save: alias for sync — stage + commit + push
save: sync

## pull: pull latest from remote branch
pull:
	git pull $(REMOTE) $(BRANCH)

## log: show recent commits (last 10)
log:
	git --no-pager log --oneline -10

## diff: show unstaged diff
diff:
	git --no-pager diff

## branch: list all branches
branch:
	git branch -a
