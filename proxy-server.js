const corsProxy = require('cors-anywhere');

const host = 'localhost';
const port = 8080;

corsProxy.createServer({
  originWhitelist: [], // Allow all origins
  requireHeader: ['origin', 'x-requested-with'],
  removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, () => {
  console.log(`CORS Proxy running on ${host}:${port}`);
});