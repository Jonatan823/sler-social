import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Elementos DOM
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const userInfo = document.getElementById('user-info');
const btnLoginGoogle = document.getElementById('btn-login-google');
const btnLogout = document.getElementById('btn-logout');
const btnProcesar = document.getElementById('btn-procesar');

// Control de Sesión y Métricas básicas de Ingreso/Egreso
onAuthStateChanged(auth, (user) => {
    if (user) {
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        userInfo.textContent = `Hola, ${user.displayName || user.email}`;
    } else {
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
    }
});

btnLoginGoogle.addEventListener('click', () => {
    signInWithPopup(auth, googleProvider).catch((error) => {
        console.error("Error en login:", error);
    });
});

btnLogout.addEventListener('click', () => {
    signOut(auth);
});

// Procesamiento S.L.E.R. adaptable y limpieza de prefijos
btnProcesar.addEventListener('click', () => {
    const textoInput = document.getElementById('texto-input').value;
    if (!textoInput.trim()) return;

    const contenedorResultado = document.getElementById('resultado');
    const anchoContenedorPx = contenedorResultado.clientWidth || 300;
    const anchoLineaDinamico = Math.max(20, Math.floor(anchoContenedorPx / 9));

    // Aquí se integrará la llamada a Gemini para el filtro conversacional previo
    const resultadoProcesado = procesarSLER(textoInput, anchoLineaDinamico);
    contenedorResultado.textContent = resultadoProcesado;
    document.getElementById('texto-input').value = "";
});

function procesarSLER(texto, anchoLinea) {
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
