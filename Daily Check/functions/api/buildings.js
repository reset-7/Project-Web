export async function onRequest({ request, env }) {
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  if (!env.REPORT_WORKER_URL || !env.REPORT_WORKER_TOKEN) {
    return Response.json({ error: "Report worker is not configured. Set REPORT_WORKER_URL and REPORT_WORKER_TOKEN in Cloudflare Pages environment variables." }, { status: 503 });
  }
  try {
    const url = env.REPORT_WORKER_URL.replace(/\/+$/, "") + "/api/buildings";
    const upstream = await fetch(url, {
      headers: { "Authorization": `Bearer ${env.REPORT_WORKER_TOKEN}` },
      signal: AbortSignal.timeout(15000)
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") || "application/json", "Cache-Control": "no-store" }
    });
  } catch (error) {
    return Response.json({ error: "Cannot reach the Windows report worker. Check the worker URL, tunnel, and worker status." }, { status: 502 });
  }
}
