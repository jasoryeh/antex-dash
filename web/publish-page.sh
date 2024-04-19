#!/bin/bash

npx vite build
cd dist &&  wrangler pages publish . --project-name=antex-dash
