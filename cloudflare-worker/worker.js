export default {
  async fetch(request, env) {
    // Handling CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, access_token",
        },
      });
    }

    try {
      const url = new URL(request.url);
      let targetUrlString = "";
      const newHeaders = new Headers(request.headers);

      if (url.pathname.startsWith("/asaas-sandbox")) {
        const remainingPath = url.pathname.replace(/^\/asaas-sandbox/, "");
        targetUrlString = `https://sandbox.asaas.com/api/v3${remainingPath}${url.search}`;
        newHeaders.set("Host", "sandbox.asaas.com");
      } else if (url.pathname.startsWith("/asaas-production")) {
        const remainingPath = url.pathname.replace(/^\/asaas-production/, "");
        targetUrlString = `https://www.asaas.com/api/v3${remainingPath}${url.search}`;
        newHeaders.set("Host", "www.asaas.com");
      } else {
        // Fallback/Default for AbacatePay
        targetUrlString = `https://api.abacatepay.com${url.pathname}${url.search}`;
        newHeaders.set("Host", "api.abacatepay.com");
      }

      const response = await fetch(targetUrlString, {
        method: request.method,
        headers: newHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : null,
        redirect: "follow"
      });

      // Prepare response headers, ensuring CORS is maintained
      const corsHeaders = new Headers(response.headers);
      corsHeaders.set("Access-Control-Allow-Origin", "*");
      corsHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      corsHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, access_token");

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
