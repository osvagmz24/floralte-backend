// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Asegúrate de tener OPENAI_API_KEY en las variables de entorno de Render
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Devuelve un texto tipo "ramo pequeño / mediano / grande"
 * según la cantidad de "florecitas visibles" (no solo tallos).
 */
function describirTamanoRamo(totalFlorecitas) {
  if (totalFlorecitas <= 12) {
    return "ramo pequeño pero muy lleno, ideal para regalo de mano";
  } else if (totalFlorecitas <= 30) {
    return "ramo mediano, abundante y balanceado";
  } else if (totalFlorecitas <= 60) {
    return "ramo grande, muy abundante y espectacular";
  } else {
    return "ramo extra grande, súper voluminoso y protagonista";
  }
}

/**
 * Detecta una paleta de color aproximada a partir de los colores elegidos.
 */
function describirPaletaColores(colores) {
  if (colores.length === 0) {
    return "paleta de colores suaves y románticos";
  }

  const unicos = [...new Set(colores.map(c => c.toLowerCase()))];

  if (unicos.length === 1) {
    return `paleta monocromática en tonos ${unicos[0]}`;
  }

  if (unicos.length === 2) {
    return `paleta combinada en tonos ${unicos[0]} y ${unicos[1]}`;
  }

  // Más de 2 colores
  return `paleta de colores variados (${unicos.join(", ")}), armónica y elegante`;
}

/**
 * Construye un prompt ultra detallado para el modelo de imagen,
 * en función del ramo seleccionado.
 */
function buildPromptDesdeRamo(ramo = []) {
  // Si por alguna razón llega vacío, devolvemos un prompt genérico
  if (!Array.isArray(ramo) || ramo.length === 0) {
    return `
Fotografía hiperrealista de un ramo de flores elegante, estilo Floralte Diseño Floral.
Ramo tipo bouquet empapelado con papel coreano en tonos neutros (beige, marfil),
muy lleno y abundante, con mezcla de flores finas y un poco de follaje verde fresco
(eucalipto y hojas delgadas), fondo neutro desenfocado, iluminación natural suave,
estilo fotografía de catálogo de florería premium.
    `.trim();
  }

  // Flores que tienen varias florecitas por tallo
  const floresMultiples = new Set(["babyrose", "margarita", "astromelia"]);

  let totalTallos = 0;
  let totalFlorecitas = 0;
  const coloresDetectados = [];
  const descripcionesFlores = ramo.map((item) => {
    const id = (item.id || "").toLowerCase();
    const nombre = item.nombre || "flor";
    const qty = Number(item.qty) || 0;
    const color = item.color || "";
    const colorTexto = color ? `de color ${color}` : "";

    totalTallos += qty;

    if (color) coloresDetectados.push(color);

    // Si la flor tiene muchas cabezas por tallo, multiplicamos para la "sensación visual"
    const multiplicador = floresMultiples.has(id) ? 5 : 1;
    const florecitasVisibles = qty * multiplicador;
    totalFlorecitas += florecitasVisibles;

    let notaMultiplicador = "";
    if (multiplicador > 1) {
      notaMultiplicador = `, formando pequeños ramitos tupidos (aprox. ${florecitasVisibles} florecitas visibles)`;
    } else {
      notaMultiplicador = ` (aprox. ${florecitasVisibles} flores visibles)`;
    }

    return `- ${qty} tallos de ${nombre} ${colorTexto}${notaMultiplicador}`;
  });

  const descripcionTamano = describirTamanoRamo(totalFlorecitas);
  const descripcionPaleta = describirPaletaColores(coloresDetectados);

  return `
Fotografía hiperrealista y elegante de un ramo de flores estilo Floralte Diseño Floral.
${descripcionTamano}, con ${descripcionPaleta}.
Ramo tipo bouquet empapelado, bien "empapelado", muy lleno y sin espacios vacíos,
envuelto en papel coreano premium en tonos neutros (beige, marfil) con ligeros acentos suaves.

Composición del ramo:
${descripcionesFlores.join("\n")}

Añade un poco de follaje verde fresco (eucalipto, ruscus, hojas finas) solo como relleno elegante,
para dar volumen y textura, sin opacar las flores principales.

Estilo de la imagen:
- Fotografía de catálogo para florería premium
- Fondo neutro y desenfocado (bokeh suave)
- Iluminación natural suave, tonos cálidos
- Ramo centrado en la imagen, ligeramente en ángulo 3/4, enfocando los detalles de las flores y el papel.
  `.trim();
}

// Endpoint para probar que el backend está vivo
app.get("/ping", (req, res) => {
  res.json({ ok: true, message: "Backend Floralte IA activo 🌸" });
});

// Endpoint principal para generar el preview con IA
app.post("/api/generar-preview-ramos", async (req, res) => {
  try {
    const { ramo } = req.body;
    console.log("💐 Ramo recibido:", JSON.stringify(ramo, null, 2));

    if (!Array.isArray(ramo) || ramo.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "El ramo está vacío. Agrega flores antes de generar el preview.",
      });
    }

    const prompt = buildPromptDesdeRamo(ramo);
    console.log("📝 Prompt enviado a OpenAI:\n", prompt);

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      quality: "high",
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
  console.log("✅ Backend Floralte IA corriendo en puerto", PORT);
});








