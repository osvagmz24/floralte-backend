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
  // Si no hay selección, usamos un prompt genérico
  if (!Array.isArray(ramo) || ramo.length === 0) {
    return `
Fotografía de un ramo de flores elegante, estilo Floralte Diseño Floral.
Ramo tipo bouquet empapelado, muy lleno y abundante, sin espacios vacíos,
envuelto en papel tipo coreano en tonos crema y rosa pálido,
fondo claro desenfocado, iluminación natural, calidad catálogo para tienda en línea.
    `.trim();
  }

  // Algunas flores tienen varias cabezas por tallo
  const floresMultiples = new Set(["babyrose", "margarita", "astromelia"]);

  let totalTallos = 0;
  let totalFlorecitas = 0;

  const partes = ramo.map((item) => {
    const id = (item.id || "").toLowerCase();
    const qty = Number(item.qty) || 0;
    const color = item.color ? `color ${item.color}` : "";
    totalTallos += qty;

    // Si es de las que traen varias flores por tallo, multiplicamos
    const multiplicador = floresMultiples.has(id) ? 5 : 1;
    const florecitas = qty * multiplicador;
    totalFlorecitas += florecitas;

    let extra = "";
    if (multiplicador > 1) {
      extra = ` (aprox. ${florecitas} florecitas en ramitos, muy tupidas)`;
    }

    return `${qty} tallos de ${item.nombre} ${color}${extra}`.trim();
  });

  // Descripción de tamaño según la cantidad total de florecitas
  let descripcionTamano = "ramo mediano y abundante";
  if (totalFlorecitas <= 12) {
    descripcionTamano = "ramo pequeño pero muy lleno";
  } else if (totalFlorecitas > 12 && totalFlorecitas <= 30) {
    descripcionTamano = "ramo mediano, muy tupido y equilibrado";
  } else if (totalFlorecitas > 30) {
    descripcionTamano = "ramo grande, muy abundante y espectacular";
  }

  return `
Fotografía de un ${descripcionTamano} estilo Floralte Diseño Floral,
ramo tipo bouquet empapelado, muy lleno y sin espacios vacíos,
con ${partes.join(", ")},
las flores de baby rose, margaritas y astromelia se representan en ramitos con varias florecitas por tallo, creando mucha textura,
envuelto en papel tipo coreano en tonos crema y rosa pálido,
listón elegante, composición armoniosa, fondo claro desenfocado,
iluminación natural suave, calidad catálogo para tienda en línea.
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


