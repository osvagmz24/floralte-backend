import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Construye texto para describir el ramo
function buildPrompt(ramo) {
    if (!ramo || ramo.length === 0) {
        return "Fotografía de un ramo elegante estilo Floralte, iluminación suave.";
    }

    const partes = ramo.map(item => {
        const c = item.color ? `color ${item.color}` : "";
        return `${item.qty} tallos de ${item.nombre} ${c}`;
    });

    return `
Fotografía de un ramo elegante estilo Floralte Diseño Floral,
con ${partes.join(", ")},
fondo claro suave, iluminación natural.
`.trim();
}

// Endpoint que llama tu página web
app.post("/api/generar-preview-ramos", async (req, res) => {
    try {
        const { ramo } = req.body;

        const prompt = buildPrompt(ramo);

        const result = await openai.images.generate({
            model: "gpt-image-1",
            prompt,
            size: "1024x1024"
        });

        const base64 = result.data[0].b64_json;
        const imageUrl = `data:image/png;base64,${base64}`;

        res.json({
            ok: true,
            imageUrl,
            prompt
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
    message
  });
}

app.listen(process.env.PORT, () => {
    console.log("Backend Floralte corriendo en puerto", process.env.PORT);
});

