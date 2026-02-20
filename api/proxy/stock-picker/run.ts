import type { VercelRequest, VercelResponse } from "@vercel/node";

const UPSTREAM_URL = "http://internet-facing-863698164.eu-north-1.elb.amazonaws.com/api/stock-picker/run";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

function buildUpstreamHeaders(req: VercelRequest): Headers {
  const headers = new Headers();

  Object.entries(req.headers).forEach(([key, value]) => {
    if (!value) return;
    const normalizedKey = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(normalizedKey)) return;

    if (Array.isArray(value)) {
      headers.set(key, value.join(", "));
      return;
    }

    headers.set(key, value);
  });

  return headers;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const upstreamResponse = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: buildUpstreamHeaders(req),
      body: JSON.stringify(req.body),
    });

    res.status(upstreamResponse.status);

    upstreamResponse.headers.forEach((value, key) => {
      if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
      res.setHeader(key, value);
    });

    const text = await upstreamResponse.text();
    return res.send(text);
  } catch (error) {
    console.error("Stock picker proxy request failed", error);
    return res.status(502).json({ error: "Bad Gateway" });
  }
}
