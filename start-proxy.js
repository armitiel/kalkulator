/**
 * CORS Proxy Server Starter
 *
 * This script starts a CORS proxy server on port 8080.
 * Run it with: node start-proxy.js
 */

try {
  // Check if cors-anywhere is installed
  require.resolve('cors-anywhere');
  
  console.log('Starting CORS proxy server...');
  console.log('The proxy will run on http://localhost:8080');
  console.log('Keep this window open while developing your application');
  console.log('');
  
  // Start the proxy server
  const corsProxy = require('cors-anywhere');
  const host = 'localhost';
  const port = 8080;
  
  // Dodajemy własny handler do obsługi błędów
  const server = corsProxy.createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: [], // Usuwamy wymagane nagłówki
    removeHeaders: ['cookie', 'cookie2'],
    httpProxyOptions: {
      // Opcje dla proxy HTTP
      secure: false, // Nie sprawdzaj certyfikatów SSL
      timeout: 5000, // Timeout 5 sekund
    }
  });
  
  // Dodajemy obsługę błędów
  server.on('error', function(err) {
    console.error('Proxy server error:', err);
  });
  
  // Nasłuchujemy na żądania
  server.listen(port, host, () => {
    console.log(`CORS Proxy running on ${host}:${port}`);
    console.log('Ready to handle requests');
  });
} catch (error) {
  console.error('Error starting CORS proxy server:');
  console.error(error.message);
  
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('\nPlease install the required dependencies first:');
    console.log('npm install cors-anywhere');
  }
  
  console.log('\nPress any key to exit...');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', process.exit.bind(process, 0));
}