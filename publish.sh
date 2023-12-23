#!/bin/sh

cwd=$PWD

# deploy backend
wrangler deploy

# deploy ui
cd web
npx vite build
cd $cwd
wrangler pages deploy web/dist
