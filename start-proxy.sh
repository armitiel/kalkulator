#!/bin/bash
echo "Starting CORS proxy server..."
echo ""
echo "The proxy will run on http://localhost:8080"
echo "Keep this window open while developing your application"
echo ""
# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"
node proxy-server.js