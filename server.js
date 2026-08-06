function buildPrompt(bouquet, wrapText) {
  const flowerList = bouquet
    .map((item, index) => {
      return `${index + 1}. ${item.qty} tallos de ${item.name}, color ${item.color}`;
    })
    .join("\n");

  const totalFlowers = bouquet.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  return `
Genera una fotografía frontal, ultrarrealista y comercial de UN SOLO ramo floral profesional.

INVENTARIO OBLIGATORIO DEL RAMO:
${flowerList}

TOTAL DE FLORES PRINCIPALES:
${totalFlowers} tallos.

REGLA MÁS IMPORTANTE:
Utiliza únicamente las especies y colores enumerados.
No agregues flores protagonistas diferentes.
No agregues proteas, rosas grandes, lirios ni flores centrales si no aparecen en el inventario.
Cada especie debe ser visualmente reconocible y aparecer en una cantidad proporcional a la solicitada.

COMPOSICIÓN:
- Ramo abierto, aireado y ligeramente asimétrico.
- Flores distribuidas en pequeños grupos naturales.
- No colocar una flor protagonista gigante en el centro.
- Snapdragon y flores altas deben sobresalir ligeramente.
- Hypericum debe verse como racimos pequeños de bayas.
- Ornithogalum debe conservar su forma estrellada.
- Eryngium debe verse como pequeños cardos azulados o verdes.
- Baby Rose debe verse como rosas pequeñas en grupos, nunca como rosas gigantes.
- Mostrar el ramo completo de arriba abajo.

FOLLAJE OBLIGATORIO Y CLARAMENTE VISIBLE:
- Eucalipto dólar verde grisáceo alrededor del perímetro.
- Eucalipto intercalado entre las flores.
- Gypsophila blanca o nube en pequeños grupos aireados.
- El follaje debe ocupar aproximadamente 25% del volumen visible.
- Debe haber follaje tanto alrededor como dentro del ramo.
- No sustituir el follaje por flores blancas.

ENVOLTURA:
${wrapText}.
Papel floral profesional en varias capas.
Listón de satén bronce pastel.
La envoltura debe sostener el ramo sin cubrir las flores.

FOTOGRAFÍA:
- Fondo marfil o rosa pastel extremadamente claro.
- Iluminación natural suave.
- Texturas reales.
- Fotografía de florería boutique.
- Sin manos, personas, texto, logotipo, florero, tarjeta ni objetos adicionales.
  `.trim();
}