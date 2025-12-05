// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 👇 Asegúrate de tener OPENAI_API_KEY configurada en Render
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Endpoint simple para probar que el backend está vivo
app.get("/ping", (req, res) => {
  res.json({ ok: true, message: "Floralte backend está vivo 🌸" });
});

// Construir prompt a partir del ramo
function buildPrompt(ramo = []) {
  if (!Array.isArray(ramo) || ramo.length === 0) {
    return `
Fotografía de un ramo de flores elegante, estilo Floralte Diseño Floral.
Flores mixtas en tonos suaves, fondo claro desenfocado, iluminación natural,
composición armoniosa tipo catálogo para tienda en línea.
    `.trim();
  }

  const partes = ramo.map((item) => {
    const c = item.color ? `color ${item.color}` : "";
    return `${item.qty} tallos de ${item.nombre} ${c}`.trim();
  });

  return `
Fotografía de un ramo de flores elegante, estilo Floralte Diseño Floral,
con ${partes.join(", ")},
composición armoniosa, fondo claro desenfocado, iluminación natural,
estilo catálogo para tienda en línea.
  `.trim();
}

// Endpoint que llama a OpenAI para generar la imagen
app.post("/api/generar-preview-ramos", async (req, res) => {
  try {
    const { ramo } = req.body;
    console.log("💐 Ramo recibido:", JSON.stringify(ramo, null, 2));

    const prompt = buildPrompt(ramo);
    console.log("📝 Prompt generado:", prompt);

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    const base64 = result.data[0].b64_json;
    const imageUrl = `data:image/png;base64,${base64}`;

    return res.json({
      ok: true,
      imageUrl,
      prompt,
    });
  } catch (error) {
    console.error("🔥 ERROR AL GENERAR IA:", error);

    const status = error.status || 500;
    const message =
      error?.error?.message ||
      error?.response?.data?.error?.message ||
      error.message ||
      "Error generando imagen.";

    return res.status(status).json({
      ok: false,
      message,
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("✅ Backend Floralte corriendo en puerto", PORT);
});

