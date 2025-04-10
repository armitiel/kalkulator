@echo off
echo Installing CORS proxy dependencies...
npm install --prefix ./proxy-server cors-anywhere
echo.
echo Dependencies installed successfully!
echo.
echo To start the proxy server, run: node proxy-server.js
echo.
echo After starting the proxy server, start your React application as usual with: npm start
echo.
pause