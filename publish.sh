#!/bin/sh

cwd=$PWD

# deploy backend
wrangler deploy

# deploy ui
cd web
bash publish-page.sh
