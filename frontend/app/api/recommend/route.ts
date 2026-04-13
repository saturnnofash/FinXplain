export async function POST(req: Request) {
  const body = await req.json();
  try {
    const res = await fetch("http://127.0.0.1:8000/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return Response.json(
        { detail: data.detail ?? "Unknown error" },
        { status: res.status }
      );
    }
    return Response.json(data);
  } catch {
    return Response.json(
      { detail: "Cannot reach the backend server." },
      { status: 503 }
    );
  }
}
