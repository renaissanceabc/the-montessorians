export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response('Missing "url" parameter', { status: 400 });
  }

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return new Response("Failed to fetch upstream image", { status: 502 });
    }

    const contentType = res.headers.get("content-type") ?? "application/octet-stream";

    return new Response(res.body, {
      status: res.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    return new Response(`Error proxying image: ${String(err)}`, {
      status: 500,
    });
  }
}
