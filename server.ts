const GAME_DIR = new URL(".", import.meta.url).pathname;
const PORT = 3000;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

async function fileResponse(path: string): Promise<Response> {
  try {
    const body = await Deno.readFile(path);
    const ext = path.slice(path.lastIndexOf("."));
    return new Response(body, {
      headers: {
        "content-type": MIME[ext] ?? "application/octet-stream",
        "cache-control": "no-cache",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}

Deno.serve({ port: PORT }, async (req): Promise<Response> => {
  const pathname = new URL(req.url).pathname;

  if (pathname === "/sheet.jpeg") {
    return fileResponse(GAME_DIR + "IMG_4879.jpeg");
  }

  if (pathname === "/sprite_map.json") {
    return fileResponse(GAME_DIR + "sprite_map.json");
  }

  const file = pathname === "/" ? "index.html" : pathname.slice(1);
  return fileResponse(GAME_DIR + "public/" + file);
});

console.log(`\n  Game Server  →  http://localhost:${PORT}\n`);
