import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { texto } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Falta configurar la API Key en el servidor' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: texto,
    });

    const respuestaTexto = response.text || "No se pudo procesar la respuesta";

    return res.status(200).json({ resultado: respuestaTexto });
  } catch (error) {
    return res.status(500).json({ error: 'Error al conectar con Gemini: ' + error.message });
  }
}
