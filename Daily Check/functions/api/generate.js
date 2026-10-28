export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  if (!env.REPORT_WORKER_URL || !env.REPORT_WORKER_TOKEN) {
    return Response.json({ error: "Report worker is not configured. Set REPORT_WORKER_URL and REPORT_WORKER_TOKEN in Cloudflare Pages environment variables." }, { status: 503 });
  }
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  try {
    const url = env.REPORT_WORKER_URL.replace(/\/+$/, "") + "/api/generate";
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.REPORT_WORKER_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      // The worker should ideally return a job ID for long jobs. This timeout
      // prevents a long synchronous request from holding the Pages Function open.
      signal: AbortSignal.timeout(100000)
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") || "application/json", "Cache-Control": "no-store" }
    });
  } catch (error) {
    return Response.json({
      error: "Could not reach the Windows report worker or the job timed out. Check the secure tunnel and worker logs."
    }, { status: 502 });
  }
}
