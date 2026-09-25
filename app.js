// Importar los SDKs de Firebase necesarios desde los CDNs
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Configuración de Firebase (Sler Social Net)
const firebaseConfig = {
  apiKey: "AIzaSyAuK6fNAjriNUawm3xab470Wmy2jbVBLAM",
  authDomain: "sler-social-net.firebaseapp.com",
  projectId: "sler-social-net",
  storageBucket: "sler-social-net.firebasestorage.app",
  messagingSenderId: "630471350697",
  appId: "1:630471350697:web:d355d49a84a56e5b6d0cb8"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Elementos del DOM
const loginView = document.getElementById('login-view');
const contactsView = document.getElementById('contacts-view');
const chatView = document.getElementById('chat-view');

const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userGreeting = document.getElementById('user-greeting');

const contactsList = document.getElementById('contacts-list');
const activeChatName = document.getElementById('active-chat-name');
const backToContactsBtn = document.getElementById('back-to-contacts');

const messageInput = document.getElementById('message-input');
const micBtn = document.getElementById('mic-btn');
const processPreviewBtn = document.getElementById('process-preview-btn');
const previewContainer = document.getElementById('preview-container');
const previewTextBox = document.getElementById('preview-text-box');

const sendTextBtn = document.getElementById('send-text-btn');
const sendVoiceBtn = document.getElementById('send-voice-btn');
const messagesContainer = document.getElementById('messages-container');

let currentContact = null;
let mensajePurificadoActual = "";

// 1. Manejo de Estado de Autenticación
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginView.classList.add('hidden');
    contactsView.classList.remove('hidden');
    chatView.classList.add('hidden');
    userGreeting.textContent = `Hola, ${user.displayName || 'usuario'}`;
  } else {
    loginView.classList.remove('hidden');
    contactsView.classList.add('hidden');
    chatView.classList.add('hidden');
  }
});

// Evento de Login con Google
loginBtn.addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error en login:", error);
  }
});

// Evento de Cerrar Sesión
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
});

// 2. Navegación entre Contactos y Chat
contactsList.addEventListener('click', (e) => {
  const item = e.target.closest('.contact-item');
  if (!item) return;

  const contactName = item.getAttribute('data-contact-name');
  currentContact = contactName;
  activeChatName.textContent = `Chat con ${contactName}`;
  
  messageInput.value = "";
  previewContainer.classList.add('hidden');
  messagesContainer.innerHTML = "";

  contactsView.classList.add('hidden');
  chatView.classList.remove('hidden');
});

backToContactsBtn.addEventListener('click', () => {
  chatView.classList.add('hidden');
  contactsView.classList.remove('hidden');
});

// 3. Procesamiento con Gemini (Filtro único estricto y formato S.L.E.R.)
processPreviewBtn.addEventListener('click', async () => {
  const textoOriginal = messageInput.value.trim();
  if (!textoOriginal) return;

  processPreviewBtn.textContent = "Procesando...";
  processPreviewBtn.disabled = true;

  try {
    mensajePurificadoActual = await procesarMensajeConGemini(textoOriginal);
    previewTextBox.textContent = mensajePurificadoActual;
    previewContainer.classList.remove('hidden');
  } catch (error) {
    console.error("Error al procesar con IA:", error);
    alert("Hubo un error al procesar el mensaje con el motor de IA.");
  } finally {
    processPreviewBtn.textContent = "Procesar con IA";
    processPreviewBtn.disabled = false;
  }
});

// Función de comunicación con la API de Gemini (Flash 1.5)
async function procesarMensajeConGemini(texto) {
  const apiKey = "AQ.Ab8RN6KL3BcW66Dq_bU-UmVphOL3IR8stYHV1m7aSQTNuA45EA";
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  const prompt = `Actúa estrictamente como el motor de filtrado y formato S.L.E.R. (Sistema de Lectura y Escrita Recíproco). 
  Reglas obligatorias:
  1. Filtra y neutraliza cualquier lenguaje inadecuado.
  2. Aplica la transformación estricta al formato S.L.E.R. (alternancia de renglones e inversión de signos).
  3. Devuelve únicamente la versión final purificada y formateada, sin introducciones ni comentarios adicionales.
  
  Texto de entrada: "${texto}"`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    throw new Error(`Error en la API de Gemini: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

// 4. Envío de Mensajes (Texto o Voz Artificial)
sendTextBtn.addEventListener('click', () => {
  if (!mensajePurificadoActual) return;
  agregarMensajeAlChat(mensajePurificadoActual, 'outgoing');
  
  messageInput.value = "";
  previewContainer.classList.add('hidden');
  mensajePurificadoActual = "";
});

sendVoiceBtn.addEventListener('click', () => {
  if (!mensajePurificadoActual) return;
  agregarMensajeAlChat(`🔊 [Voz Artificial] ${mensajePurificadoActual}`, 'outgoing');
  reproducirVozArtificial(mensajePurificadoActual);

  messageInput.value = "";
  previewContainer.classList.add('hidden');
  mensajePurificadoActual = "";
});

function agregarMensajeAlChat(texto, tipo) {
  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${tipo}`;
  bubble.textContent = texto;
  messagesContainer.appendChild(bubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function reproducirVozArtificial(texto) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("La síntesis de voz no es compatible con este navegador.");
  }
}

// 5. Dictado por Voz (SpeechRecognition nativo)
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.continuous = false;

  micBtn.addEventListener('click', () => {
    recognition.start();
    micBtn.textContent = "🎙️ Escuchando...";
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    messageInput.value = transcript;
    micBtn.textContent = "🎙️ Dictar";
  };

  recognition.onerror = () => {
    micBtn.textContent = "🎙️ Dictar";
  };

  recognition.onend = () => {
    micBtn.textContent = "🎙️ Dictar";
  };
} else {
  micBtn.style.display = 'none';
}
