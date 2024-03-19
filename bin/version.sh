#!/bin/bash

# get commit name from args
commit="$1"

# get commit prefix
commit_prefix="${commit%%:*}"

# check commit prefix
if [ "$commit_prefix" == "feat" ]; then
    npm version minor --git-tag-version false
else
    npm version patch --git-tag-version false
fi