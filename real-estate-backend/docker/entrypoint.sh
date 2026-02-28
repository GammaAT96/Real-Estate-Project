#!/bin/sh
# docker/entrypoint.sh
# Runs on container startup — applies DB migrations then starts the server

set -e

echo "⏳ Running Prisma migrations..."
npx prisma migrate deploy

echo "🚀 Starting server..."
exec node dist/server.js
