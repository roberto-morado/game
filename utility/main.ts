const UTIL_DIR = new URL(".", import.meta.url).pathname;
const GAME_DIR = new URL("..", import.meta.url).pathname;
const PORT = 8000;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
  ".jpeg": "image/jpeg",
};

async function fileResponse(path: string): Promise<Response> {
  try {
    const body = await Deno.readFile(path);
    const ext = path.slice(path.lastIndexOf("."));
    return new Response(body, {
      headers: { "content-type": MIME[ext] ?? "application/octet-stream" },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}

Deno.serve({ port: PORT }, async (req): Promise<Response> => {
  const { pathname, method } = Object.assign(new URL(req.url), { method: req.method });

  if (pathname === "/api/sprite-map" && method === "GET") {
    return fileResponse(GAME_DIR + "sprite_map.json");
  }

  if (pathname === "/api/sprite-map" && method === "POST") {
    const text = await req.text();
    JSON.parse(text); // validate JSON before writing
    await Deno.writeTextFile(GAME_DIR + "sprite_map.json", text);
    return new Response('{"ok":true}', {
      headers: { "content-type": "application/json" },
    });
  }

  if (pathname === "/sheet.jpeg") {
    return fileResponse(GAME_DIR + "IMG_4879.jpeg");
  }

  const file = pathname === "/" ? "index.html" : pathname.slice(1);
  return fileResponse(UTIL_DIR + "public/" + file);
});

console.log(`\n  Sprite Calibrator  →  http://localhost:${PORT}\n`);
