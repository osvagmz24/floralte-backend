import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "3mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const PAPER_TYPES = {
  coreano: "papel coreano mate con pliegues amplios y elegantes",
  kraft: "papel kraft floral de acabado premium",
  peyon: "papel peyón translúcido y delicado"
};

const WRAP_STYLES = {
  circular:
    "ramo circular natural, tridimensional, con silueta orgánica, picos suaves y flores visibles desde varios ángulos; no perfectamente redondo ni compacto",

  "una-vista":
    "ramo de una vista, frontal y editorial, con todas las flores principales orientadas hacia el frente y una silueta alta ligeramente asimétrica"
};

const DEFAULT_FOLIAGE = {
  eucalyptus: "eucalipto dólar verde grisáceo",
  gypsophila: "gypsophila blanca, también llamada nube"
  
};

function cleanText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function clampInteger(value, min = 1, max = 80) {
  const parsed = Math.round(Number(value));

  if (!Number.isFinite(parsed)) {
    return min;
  }

  return Math.min(max, Math.max(min, parsed));
}

function normalizeBouquet(rawBouquet) {
  if (!Array.isArray(rawBouquet)) {
    return [];
  }

  return rawBouquet
    .map((item, index) => {
      const name = cleanText(
        item?.nombre ?? item?.name,
        `Flor ${index + 1}`
      );

      const color = cleanText(
        item?.color,
        "natural"
      );

      const qty = clampInteger(
        item?.qty ?? item?.cantidad,
        1,
        80
      );

      return {
        name,
        color,
        qty
      };
    })
    .filter(item => item.name);
}

function normalizeWrap(envoltura = {}, envolturaLabel = "") {
  const customLabel = cleanText(envolturaLabel);

  if (customLabel) {
    return customLabel;
  }

  const paperType = cleanText(
    envoltura?.paperType,
    "coreano"
  ).toLowerCase();

  const wrapStyle = cleanText(
    envoltura?.wrapStyle,
    "circular"
  ).toLowerCase();

  const paperColor = cleanText(
    envoltura?.paperColor,
    "rosa pastel"
  );

  const paper =
    PAPER_TYPES[paperType] ||
    `${paperType} floral premium`;

  const style =
    WRAP_STYLES[wrapStyle] ||
    WRAP_STYLES.circular;

  return `${paper}, color ${paperColor}; ${style}`;
}

function quantityInstruction(qty, flowerName, color) {
  return `
- EXACTAMENTE ${qty} tallos visibles de ${flowerName}, color ${color}.
- No reemplazar esta especie.
- No cambiar el color.
- No duplicar la cantidad.
- No omitirla.
  `.trim();
}

function compositionPlan(bouquet) {
  const total = bouquet.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  const dominant = [...bouquet].sort(
    (a, b) => b.qty - a.qty
  )[0];

  const flowerLines = bouquet.map(item =>
    quantityInstruction(
      item.qty,
      item.name,
      item.color
    )
  );

  return {
    total,
    dominant,
    flowerLines: flowerLines.join("\n\n")
  };
}

function buildPrompt(bouquet, wrapText) {
  const {
    total,
    dominant,
    flowerLines
  } = compositionPlan(bouquet);

  return `
OBJETIVO GENERAL

Genera UNA fotografía comercial ultrarrealista de un ramo floral premium.

Debe parecer un ramo construido físicamente por una florista profesional.

No debe parecer ilustración, collage, pintura ni render 3D.

El resultado debe mostrar únicamente un ramo completo.


INVENTARIO FLORAL OBLIGATORIO

El ramo contiene ${total} tallos florales principales.

${flowerLines}


REGLA DE FIDELIDAD

Respeta con la mayor precisión visual posible:

- Cada especie de flor.
- Cada color solicitado.
- La cantidad pedida de cada flor.
- La diferencia visual entre cada variedad.

No sustituyas una especie por otra.

No cambies los colores.

No agregues otras flores protagonistas.

No conviertas flores pequeñas en flores grandes.

No mezcles visualmente dos especies diferentes.

La variedad dominante es:

${dominant.name}, color ${dominant.color}.

Sin embargo, todas las demás variedades deben mantenerse visibles y reconocibles.


FOLLAJE OBLIGATORIO

Agregar SIEMPRE follaje floral real y claramente visible.

El follaje no es opcional.

Debe incluir:

- ${DEFAULT_FOLIAGE.eucalyptus}.
- ${DEFAULT_FOLIAGE.gypsophila}.

Distribución del follaje:

- Colocar eucalipto dólar alrededor del perímetro del ramo.
- Colocar ramas de eucalipto también entre flores.
- Colocar gypsophila blanca en pequeños grupos aireados.
- La gypsophila debe aparecer entre las flores, no solamente en la parte exterior.
- El follaje debe entrar y salir de las distintas capas del ramo.
- El follaje debe ocupar entre 20% y 28% del volumen visual total.
- Debe verse abundante, natural, fresco y profesional.
- No debe tapar las flores principales.
- No debe alterar visualmente las cantidades solicitadas.

No usar:

- Hojas tropicales grandes.
- Helechos.
- Pasto pampas.
- Follaje artificial.
- Hojas gigantes.
- Plantas que no pertenezcan a un ramo floral elegante.


ARQUITECTURA DEL RAMO

El ramo debe tener construcción profesional con espiral de tallos.

Debe sentirse tridimensional y físicamente posible.


No colocar las flores como cuadrícula.

No colocar las flores en círculos repetidos perfectos.

No ordenar todas las flores exactamente a la misma altura.

Crear varias capas de profundidad:

- Flores principales al frente y en la zona central.
- Flores secundarias alrededor.
- Flores pequeñas entre las flores grandes.
- Eucalipto entrando y saliendo entre capas.
- Gypsophila rellenando espacios sin saturar.
- Algunas flores ligeramente más altas.
- Algunas flores ligeramente más bajas.

La silueta debe ser:

- Orgánica.
- Elegante.
- Equilibrada.
- Ligeramente asimétrica.
- Natural.
- Premium.
- Con movimiento visual.

El ramo debe tener suficiente volumen.

Debe parecer recién elaborado y fresco.

Debe mostrarse el ramo completo.

Debe verse parte de la zona inferior de la envoltura y el listón.


ENVOLTURA

${wrapText}.

La envoltura debe tener:

- Pliegues florales profesionales.
- Varias capas de papel.
- Bordes limpios.
- Forma elegante.
- Volumen suficiente.
- Un listón de satén color bronce pastel.
- Acabado de florería boutique.

La envoltura debe sostener el ramo.

No debe cubrir excesivamente las flores.

No debe ser una bolsa.

No debe ser una caja.

No debe parecer plástico barato.


FOTOGRAFÍA

Crear una fotografía vertical de producto.

Composición centrada.

Vista frontal ligeramente elevada.

Mostrar el ramo completo.

Usar un fondo liso:

- Color marfil cálido.
- Rosa pastel muy claro.
- Beige floral muy claro.

Iluminación:

- Luz natural suave de estudio.
- Sombras delicadas.
- Brillo controlado.
- Sin luz dura.
- Sin reflejos exagerados.

Nivel de detalle:

- Pétalos realistas.
- Textura natural de las flores.
- Hojas reales.
- Tallos parcialmente visibles.
- Follaje claramente identificable.
- Papel con textura real.
- Listón de satén realista.

La imagen debe tener estética:

- Florería boutique premium.
- Elegante.
- Romántica.
- Delicada.
- Comercial.
- Profesional.
- Alta calidad.


PROHIBICIONES

Sin personas.

Sin manos.

Sin caras.

Sin cuerpos.

Sin floreros.

Sin jarrones.

Sin mesas visibles.

Sin texto.

Sin letras.

Sin precios.

Sin logotipos.

Sin marcas de agua.

Sin tarjetas.

Sin globos.

Sin mariposas.

Sin joyería.

Sin coronas.

Sin objetos decorativos ajenos al ramo.

No ilustración.

No pintura.

No acuarela.

No estilo caricatura.

No render 3D.

No collage.

No flores flotantes.

No flores deformes.

No pétalos fusionados.

No tallos imposibles.

No especies mezcladas entre sí.

No flores cortadas de manera antinatural.

No duplicar flores de forma repetitiva.

No crear patrones artificiales.
  `.trim();
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "Floralte IA"
  });
});

app.post("/api/generar-preview-ramos", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        ok: false,
        message:
          "Falta configurar OPENAI_API_KEY en el servidor."
      });
    }

    const {
      ramo,
      bouquet,
      envoltura,
      envolturaLabel
    } = req.body ?? {};

    const normalizedBouquet = normalizeBouquet(
      ramo ?? bouquet
    );

    if (!normalizedBouquet.length) {
      return res.status(400).json({
        ok: false,
        message:
          "Agrega al menos una flor antes de generar el preview."
      });
    }

    const wrapText = normalizeWrap(
      envoltura,
      envolturaLabel
    );

    const prompt = buildPrompt(
      normalizedBouquet,
      wrapText
    );

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      quality: "high"
    });

    const base64 = result.data?.[0]?.b64_json;

    if (!base64) {
      return res.status(502).json({
        ok: false,
        message:
          "La API no devolvió una imagen válida."
      });
    }

    return res.json({
      ok: true,
      imageUrl: `data:image/png;base64,${base64}`,
      normalizedBouquet,
      prompt
    });

  } catch (error) {
    console.error(
      "Error generando imagen:",
      error
    );

    const status =
      Number(error?.status) || 500;

    const message =
      error?.error?.message ||
      error?.message ||
      "Error desconocido generando la imagen.";

    return res
      .status(
        status >= 400 && status < 600
          ? status
          : 500
      )
      .json({
        ok: false,
        message
      });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Backend Floralte corriendo en puerto ${PORT}`
  );
});