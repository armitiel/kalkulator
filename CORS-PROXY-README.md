# CORS Proxy Setup for Development

This guide explains how to set up and use the CORS proxy to avoid CORS errors when developing locally.

## Why a CORS Proxy?

When running the application locally (on localhost:3000), you may encounter CORS errors when trying to access the API at `https://kalkulatortsq.vercel.app/api`. This happens because the server doesn't have CORS headers configured to allow requests from your local development environment.

The CORS proxy acts as a middleman, allowing your local application to communicate with the API without CORS errors.

## Setup Instructions

1. Install the required dependencies:

```bash
# Navigate to the directory containing proxy-package.json
cd /path/to/project

# Install dependencies
npm install --prefix ./proxy-server cors-anywhere
```

2. Start the CORS proxy server:

```bash
# Start the proxy server
node proxy-server.js
```

You should see the message: `CORS Proxy running on localhost:8080`

3. Keep this terminal window open while you're developing. The proxy server needs to be running for the application to communicate with the API.

4. In a separate terminal, start your React application as usual:

```bash
npm start
```

## How It Works

The application has been configured to send API requests through the proxy server:

1. Your app makes a request to `http://localhost:8080/https://kalkulatortsq.vercel.app/api`
2. The proxy server forwards this request to `https://kalkulatortsq.vercel.app/api`
3. The proxy server receives the response and adds the necessary CORS headers
4. The proxy server sends the response back to your application

## Troubleshooting

If you're still experiencing CORS errors:

1. Make sure the proxy server is running (you should see `CORS Proxy running on localhost:8080` in the terminal)
2. Check that the API_BASE_URL in `src/api.js` is correctly configured to use the proxy
3. Try clearing your browser cache and reloading the page
4. Check the browser console for any specific error messages

## Production Deployment

This proxy setup is for development only. In production, the application should connect directly to the API without using a proxy. The API server should be configured to allow requests from your production domain.