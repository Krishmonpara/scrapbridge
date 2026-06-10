#!/bin/bash
export HOME=/Users/krishmonpara
export PATH=/opt/homebrew/opt/node@22/bin:/opt/homebrew/bin:/usr/bin:/bin
cd /Users/krishmonpara/Desktop/ScrapWithMe/scrapbridge
exec /opt/homebrew/opt/node@22/bin/node node_modules/.bin/next dev --webpack
