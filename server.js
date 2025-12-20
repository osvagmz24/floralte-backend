import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helpers para “bonito” y consistente
function wrapLabelFromObject(envoltura) {
  if (!envoltura) return "";
  const paperMap = { coreano: "papel coreano", kraft: "papel kraft", peyon: "papel peyón" };
  const styleMap = { circular: "circular", "una-vista": "de una vista (frontal/editorial)" };

  const paper = paperMap[envoltura.paperType] || "papel";
  const style = styleMap[envoltura.wrapStyle] || "circular";
  const color = envoltura.paperColor || "blanco";

  return `${paper}, estilo ${style}, color del papel ${color}`;
}

// Construye texto para describir el ramo + envoltura
function buildPrompt(ramo, envoltura, envolturaLabel) {
  // 1) Base estética
  const base = `
Fotografía ultra realista de un ramo elegante estilo Floralte Diseño Floral.
Iluminación suave natural, alta calidad, enfoque profesional, fondo claro limpio.
Acabado premium, armonía de colores, volumen equilibrado, aspecto fresco.
`.trim();

  // 2) Composición
  let comp = "Composición: un ramo elegante con flores premium.";
  if (ramo && Array.isArray(ramo) && ramo.length > 0) {
    const partes = ramo.map(item => {
      const c = item.color ? `color ${item.color}` : "";
      const qty = Number(item.qty) || 1;
      const nombre = item.nombre || "flor";
      return `${qty} tallos de ${nombre} ${c}`.trim();
    });

    comp = `Composición: ${partes.join(", ")}.`;
  }

  // 3) Envoltura
  const envolturaText =
    (envolturaLabel && String(envolturaLabel).trim()) ||
    wrapLabelFromObject(envoltura);

  const wrapLine = envolturaText
    ? `Envoltura del ramo: ${envolturaText}.`
    : `Envoltura del ramo: papel elegante (sin especificar).`;

  // 4) “Negativos” para evitar cosas raras
  const negatives = `
Sin texto, sin marcas, sin logotipos, sin manos, sin personas, sin caras, sin letras, sin watermark.
No collage, no ilustración, no estilo caricatura.
`.trim();

  return [base, comp, wrapLine, negatives].join("\n");
}

// Endpoint que llama tu página web
app.post("/api/generar-preview-ramos", async (req, res) => {
  try {
    const { ramo, envoltura, envolturaLabel } = req.body;

    const prompt = buildPrompt(ramo, envoltura, envolturaLabel);

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024"
    });

    const base64 = result.data?.[0]?.b64_json;
    if (!base64) {
      return res.status(500).json({
        ok: false,
        message: "La API no devolvió b64_json"
      });
    }

    const imageUrl = `data:image/png;base64,${base64}`;

    res.json({
      ok: true,
      imageUrl,
      prompt
    });
  } catch (error) {
    console.error("Error generando imagen:", error);
    res.status(500).json({
      ok: false,
      message: "Error generando imagen"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend Floralte corriendo en puerto", PORT);
});
