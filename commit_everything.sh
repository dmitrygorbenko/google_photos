#!/bin/bash

MESSAGE=$1
if [[ -z $MESSAGE ]]; then
    MESSAGE="adding changes"
fi

git add --all
git commit -m "$MESSAGE"
git push
