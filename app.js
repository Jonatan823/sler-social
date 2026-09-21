import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA1VUXm-OtZE3oX4UgvO6VYUKY7RcneKDg",
  authDomain: "sler-chat-lab.firebaseapp.com",
  databaseURL: "https://sler-chat-lab-default-rtdb.firebaseio.com",
  projectId: "sler-chat-lab",
  storageBucket: "sler-chat-lab.firebasestorage.app",
  messagingSenderId: "594954603335",
  appId: "1:594954603335:web:30014b07c4fecc27521a62",
  measurementId: "G-F1QW9J6B0P"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Elementos DOM generales
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const userInfo = document.getElementById('user-info');
const btnLoginGoogle = document.getElementById('btn-login-google');
const btnLogout = document.getElementById('btn-logout');

// Control de Sesión
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (authSection) authSection.classList.add('hidden');
        if (appSection) appSection.classList.remove('hidden');
        if (userInfo) userInfo.textContent = `Hola, ${user.displayName || user.email}`;
    } else {
        if (authSection) authSection.classList.remove('hidden');
        if (appSection) appSection.classList.add('hidden');
    }
});

if (btnLoginGoogle) {
    btnLoginGoogle.addEventListener('click', () => {
        signInWithPopup(auth, googleProvider).catch((error) => {
            console.error("Error en login:", error);
        });
    });
}

if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        signOut(auth);
    });
}

// Lógica de procesamiento S.L.E.R. y Gemini
async function procesarMensajeConGemini(textoOriginal, anchoLinea) {
    const GEMINI_API_KEY = "AQAb8RN6KHlXxCJ89VgxJpjviBkQLPTODL5EgW0Qcbkn1j33VDpA"; // Recuerda usar tu clave de Gemini sin espacios iniciales
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
        return aplicarSLER(textoFiltrado, anchoLinea);

    } catch (error) {
        console.error("Error al conectar con Gemini:", error);
        return aplicarSLER(textoOriginal, anchoLinea);
    }
}

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
            return linea;
        } else {
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

const btnProcesar = document.getElementById('btn-procesar');
if (btnProcesar) {
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
}
