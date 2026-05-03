import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API Routes (Placeholders as per requirement, though frontend uses Firebase)
  app.get("/api/health", (req, res) => {
    res.json({ status: "MindCare AI Backend Online", timestamp: new Date() });
  });

  // Example API for sentiment (Proxy for Gemini)
  app.post("/api/analyze-sentiment", (req, res) => {
    // In a production app, we might handle sensitive NLP here
    res.json({ message: "Sentiment analysis endpoint active." });
  });

  // Vite integration
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
    console.log(`MindCare AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
