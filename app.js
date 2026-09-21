// Función para enviar el texto al filtro de Gemini y luego aplicar S.L.E.R.
async function procesarMensajeConGemini(textoOriginal, anchoLinea) {
    const GEMINI_API_KEY = "AQ.Ab8RN6KHlxXCj89VgxJpjviBkqLPTODL5EgW0QcbknljJ3VDpA"; // Reemplaza con tu clave de API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Prompt estricto para que Gemini actúe como filtro y neutralizador
    const promptSistema = `Eres un filtro conversacional de seguridad para una red social. Tu única tarea es analizar el siguiente texto: si contiene lenguaje tóxico, agresivo, insultos o contenido inadecuado, debes neutralizarlo y reescribirlo con un tono totalmente amable, neutral y seguro. Si el texto ya es adecuado, mantenlo intacto. Devuelve ÚNICAMENTE el texto limpio resultante, sin explicaciones ni comillas: "${textoOriginal}"`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptSistema }] }]
            })
        });

        const data = await response.json();
        const textoFiltrado = data.candidates[0].content.parts[0].text.trim();

        // Una vez filtrado por la IA, aplicamos la lógica S.L.E.R.
        return aplicarSLER(textoFiltrado, anchoLinea);

    } catch (error) {
        console.error("Error al conectar con Gemini:", error);
        // Fallback de seguridad: si falla la red, procesa el texto original localmente
        return aplicarSLER(textoOriginal, anchoLinea);
    }
}

// Lógica local de S.L.E.R. (adaptativa e inversión de líneas pares)
function aplicarSLER(texto, anchoLinea) {
    const palabras = texto.trim().replace(/\s+/g, ' ').split(' ');
    let lineas = [];
    let lineaActual = "";

    for (let palabra of palabras) {
        if ((lineaActual + " " + palabra).trim().length <= anchoLinea) {
            lineaActual = lineaActual ? lineaActual + " " + palabra : palabra;
        } else {
            if (lineaActual) lineas.push(lineaActual);
            lineaActual = palabra;
        }
    }
    if (lineaActual) lineas.push(lineaActual);

    let lineasProcesadas = lineas.map((linea, index) => {
        let numeroRenglon = index + 1;
        if (numeroRenglon % 2 !== 0) {
            return linea; // Líneas impares: izquierda a derecha
        } else {
            // Líneas pares: derecha a izquierda con reubicación de signos
            let palabrasLinea = linea.split(' ');
            let invertidas = palabrasLinea.reverse().map((p) => {
                let signoDetectado = "";
                let limpia = p;
                if (p.endsWith(',') || p.endsWith('.')) {
                    signoDetectado = p.slice(-1);
                    limpia = p.slice(0, -1);
                }
                return signoDetectado ? limpia + " " + signoDetectado : limpia;
            });
            return invertidas.join(' ').replace(/\s+([,./])/g, '$1');
        }
    });

    return lineasProcesadas.join('\n');
}

// Modificamos el evento del botón para usar la función asíncrona
btnProcesar.addEventListener('click', async () => {
    const textoInput = document.getElementById('texto-input').value;
    if (!textoInput.trim()) return;

    btnProcesar.textContent = "Analizando y procesando...";
    btnProcesar.disabled = true;

    const contenedorResultado = document.getElementById('resultado');
    const anchoContenedorPx = contenedorResultado.clientWidth || 300;
    const anchoLineaDinamico = Math.max(20, Math.floor(anchoContenedorPx / 9));

    const resultadoFinal = await procesarMensajeConGemini(textoInput, anchoLineaDinamico);
    
    contenedorResultado.textContent = resultadoFinal;
    document.getElementById('texto-input').value = "";
    btnProcesar.textContent = "🔄 Enviar y Aplicar S.L.E.R.";
    btnProcesar.disabled = false;
});
