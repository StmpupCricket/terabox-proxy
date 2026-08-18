// worker.js - TeraBox API Proxy
// Deploy this to Cloudflare Workers

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Get the target API from environment variables or use default
    const TARGET_API = env.TARGET_API || 'https://teraplayer-xfwi.onrender.com/api/preview';

    // Only allow POST requests (the Render API requires POST)
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Method Not Allowed. Please use POST.'
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      // Parse the request body to validate it
      let requestBody;
      try {
        requestBody = await request.json();
      } catch (e) {
        return new Response(JSON.stringify({
          ok: false,
          error: 'Invalid JSON body. Please send a valid JSON object with a "url" field.'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Validate that the URL is provided
      if (!requestBody.url) {
        return new Response(JSON.stringify({
          ok: false,
          error: 'Missing "url" field in request body.'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Forward the request to the Render API
      const response = await fetch(TARGET_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Cloudflare-Worker/1.0',
        },
        body: JSON.stringify({ url: requestBody.url }),
      });

      // Get the response data
      const data = await response.json();

      // Return the response with CORS headers
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

    } catch (error) {
      // Handle any unexpected errors
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        ok: false,
        error: 'Internal server error: ' + error.message,
        source: 'cloudflare-worker'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
