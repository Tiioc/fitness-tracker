import { NextRequest, NextResponse } from "next/server";

const BASE = "https://api.ouraring.com/v2/usercollection";

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-oura-token");
  if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];
  const qs = `?start_date=${today}&end_date=${today}`;
  const hdrs = { Authorization: `Bearer ${token}` };

  try {
    const [r, s, a] = await Promise.all([
      fetch(`${BASE}/daily_readiness${qs}`, { headers: hdrs }).then(x => x.json()),
      fetch(`${BASE}/daily_sleep${qs}`,     { headers: hdrs }).then(x => x.json()),
      fetch(`${BASE}/daily_activity${qs}`,  { headers: hdrs }).then(x => x.json()),
    ]);

    return NextResponse.json({
      readiness: r.data?.[0] ?? null,
      sleep:     s.data?.[0] ?? null,
      activity:  a.data?.[0] ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Oura API unreachable" }, { status: 502 });
  }
}
