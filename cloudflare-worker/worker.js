export default {
  async fetch(request, env) {
    // Handling CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    try {
      const url = new URL(request.url);
      
      // Target AbacatePay API URL
      const targetUrl = new URL(url.pathname + url.search, "https://api.abacatepay.com");
      
      // We take the request headers and pass them forward
      // The frontend will send the Authorization header directly
      const newHeaders = new Headers(request.headers);
      newHeaders.set("Host", "api.abacatepay.com");

      const response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: newHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : null,
        redirect: "follow"
      });

      // Prepare response headers, ensuring CORS is maintained
      const corsHeaders = new Headers(response.headers);
      corsHeaders.set("Access-Control-Allow-Origin", "*");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: corsHeaders
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }
  }
};
