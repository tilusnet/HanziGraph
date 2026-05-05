#!/bin/sh

exec python3 ../scripts/server_with_rewrites.py \
  --base-path "${SERVER_BASE_PATH:-/}"
