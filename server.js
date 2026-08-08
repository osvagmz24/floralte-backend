import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// =====================================================
// OPENAI
// =====================================================

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ Falta OPENAI_API_KEY");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Floralte IA",
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY)
  });
});


// =====================================================
// HELPERS
// =====================================================

function cleanText(value, fallback = "") {
  if (typeof value !== "string") return fallback;

  return value
    .trim()
    .slice(0, 200);
}


function normalizeStyle(body = {}) {

  const raw =
    body.estilo ||
    body.style ||
    body.envoltura?.style ||
    body.envoltura?.wrapStyle ||
    body.envoltura?.paperType ||
    "";

  const value = String(raw).toLowerCase();

  if (
    value.includes("franc") ||
    value === "frances"
  ) {
    return "frances";
  }

  return "coreano";
}


function normalizeFlowers(ramo) {

  if (!Array.isArray(ramo)) {
    return [];
  }

  return ramo
    .map((flower) => {

      const nombre =
        cleanText(
          flower.nombre ||
          flower.name ||
          flower.id,
          "Flor"
        );

      const color =
        cleanText(
          flower.color,
          "Natural"
        );

      let qty = Number(
        flower.qty ??
        flower.cantidad ??
        1
      );

      if (!Number.isFinite(qty)) {
        qty = 1;
      }

      qty = Math.max(
        1,
        Math.min(100, Math.round(qty))
      );

      return {
        nombre,
        color,
        qty
      };

    })
    .filter((flower) => flower.nombre);
}


// =====================================================
// PROMPT DEL RAMO
// =====================================================

function buildBouquetPrompt({
  flowers,
  style
}) {

  const flowerDescription = flowers
    .map(
      (flower, index) =>
        `${index + 1}. ${flower.qty} tallos de ${flower.nombre}, color ${flower.color}`
    )
    .join("\n");


  const total = flowers.reduce(
    (sum, flower) => sum + flower.qty,
    0
  );


  let styleInstructions = "";


  if (style === "frances") {

    styleInstructions = `
ESTILO DEL RAMO: FRANCÉS.

El ramo debe tener una composición floral francesa elegante,
romántica y artesanal.

Características obligatorias:

- silueta redondeada y ligeramente natural;
- flores distribuidas con apariencia orgánica;
- composición elegante, delicada y refinada;
- volumen equilibrado;
- las flores pueden sobresalir ligeramente unas de otras;
- acabado de floristería premium;
- envoltura elegante de inspiración francesa;
- papel discreto, fino y sofisticado;
- evitar exceso de capas geométricas;
- presentación romántica y delicada.
`;

  } else {

    styleInstructions = `
ESTILO DEL RAMO: COREANO.

El ramo debe utilizar una envoltura coreana moderna y premium.

Características obligatorias:

- varias capas visibles de papel;
- pliegues amplios y geométricos;
- estructura envolvente alrededor de las flores;
- volumen visual grande;
- acabado elegante y contemporáneo;
- diseño limpio y sofisticado;
- ramo tipo boutique coreana;
- papel cuidadosamente doblado;
- presentación premium de floristería.
`;

  }


  return `
Genera una fotografía ULTRARREALISTA de un ramo floral profesional
de la marca Floralte.

Debe parecer una fotografía real de producto tomada dentro de una
florería premium.

IMPORTANTE:
Respeta lo mejor posible las especies, colores y proporciones de flores
indicadas por el cliente.

SELECCIÓN DEL CLIENTE:

${flowerDescription}

TOTAL APROXIMADO:
${total} tallos.

${styleInstructions}

COMPOSICIÓN:

Las flores principales deben ser visualmente dominantes.

Las flores pequeñas, secundarias o follajes deben utilizarse para
rellenar espacios y aportar textura sin ocultar las flores principales.

No sustituyas flores importantes por rosas genéricas.

No conviertas todo el ramo en rosas.

Respeta especialmente:

- especie floral;
- color solicitado;
- proporción aproximada;
- estructura del ramo.

Puedes añadir únicamente una cantidad moderada de follaje profesional
para que el ramo tenga estructura.

Usar follaje floral realista como:

- eucalipto dólar;
- gypsophila;
- nube;
- follaje verde fino.

El follaje NO debe dominar la composición.


FOTOGRAFÍA:

- fotografía floral profesional;
- iluminación suave de estudio;
- profundidad de campo natural;
- fondo limpio y ligeramente desenfocado;
- ramo centrado;
- composición completa visible;
- calidad comercial;
- textura realista;
- flores frescas;
- sin personas;
- sin manos;
- sin texto;
- sin logotipos inventados;
- sin etiquetas;
- sin marcas de agua.

La imagen debe mostrar claramente la diferencia entre las flores
seleccionadas y la estructura del estilo solicitado.
`;
}


// =====================================================
// GENERAR PREVIEW
// =====================================================

app.post(
  "/api/generar-preview-ramos",
  async (req, res) => {

    try {

      if (!process.env.OPENAI_API_KEY) {

        return res.status(500).json({
          ok: false,
          error: "OPENAI_API_KEY no está configurada."
        });

      }


      const flowers =
        normalizeFlowers(req.body?.ramo);


      if (!flowers.length) {

        return res.status(400).json({
          ok: false,
          error:
            "No recibí flores para generar el ramo."
        });

      }


      const style =
        normalizeStyle(req.body);


      const prompt =
        buildBouquetPrompt({
          flowers,
          style
        });


      console.log(
        `🌸 Generando ramo Floralte: ${flowers.length} tipos de flor · estilo ${style}`
      );


      const result =
        await openai.images.generate({

          model: "gpt-image-2",

          prompt,

          size: "1024x1024",

          quality: "medium"

        });


      const base64 =
        result?.data?.[0]?.b64_json;


      if (!base64) {

        console.error(
          "Respuesta inesperada OpenAI:",
          result
        );

        return res.status(502).json({
          ok: false,
          error:
            "OpenAI no devolvió una imagen."
        });

      }


      /*
        Convertimos el base64 a Data URL.

        Esto permite que tu HTML haga:

        previewImg.src = data.imageUrl
      */

      const imageUrl =
        `data:image/png;base64,${base64}`;


      return res.status(200).json({

        ok: true,

        imageUrl,

        style,

        flowers,

        prompt

      });


    } catch (error) {

      console.error(
        "❌ ERROR GENERANDO RAMO:",
        error
      );


      let message =
        error?.message ||
        "Error generando la visualización.";


      if (
        error?.status === 401 ||
        error?.code === "invalid_api_key"
      ) {

        message =
          "La API Key de OpenAI no es válida.";

      }


      if (error?.status === 429) {

        message =
          "OpenAI está limitando temporalmente las solicitudes o no hay saldo disponible.";

      }


      return res
        .status(error?.status || 500)
        .json({

          ok: false,

          error: message

        });

    }

  }
);


// =====================================================
// 404 API
// =====================================================

app.use("/api", (req, res) => {

  res.status(404).json({

    ok: false,

    error: `Endpoint no encontrado: ${req.method} ${req.originalUrl}`

  });

});


// =====================================================
// SERVER
// =====================================================

const PORT =
  process.env.PORT || 3000;


app.listen(PORT, () => {

  console.log(
    `🌸 Floralte backend activo en puerto ${PORT}`
  );

});