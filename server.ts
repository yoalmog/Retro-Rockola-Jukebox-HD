import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      system: "Rockola 24 Digital Jukebox",
      platform: "Ubuntu Linux",
      time: new Date().toISOString()
    });
  });

  // Vite middleware for dev or static serving for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Rockola 24] Server running on http://0.0.0.0:${PORT} (Ubuntu Linux ready)`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Rockola 24 server:", err);
  process.exit(1);
});
