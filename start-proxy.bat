@echo off
echo Starting CORS proxy server...
echo.
echo The proxy will run on http://localhost:8080
echo Keep this window open while developing your application
echo.
cd %~dp0
node proxy-server.js