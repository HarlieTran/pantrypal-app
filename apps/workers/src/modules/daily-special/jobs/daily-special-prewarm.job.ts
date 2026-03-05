export async function runDailySpecialPrewarm() {
  const apiBase = process.env.API_BASE_URL;
  const key = process.env.INTERNAL_WORKER_KEY;
  if (!apiBase || !key) throw new Error("Missing API_BASE_URL or INTERNAL_WORKER_KEY");

  const res = await fetch(`${apiBase}/internal/home/prewarm`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Prewarm failed: ${res.status} ${txt}`);
  }

  console.log("daily special prewarmed", new Date().toISOString());
}
