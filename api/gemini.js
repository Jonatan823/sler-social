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
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: texto }] }]
      })
    });

    const data = await response.json();
    
    // Extraemos el texto de forma segura para enviarlo limpio al cliente
    const respuestaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo procesar la respuesta";

    return res.status(200).json({ resultado: respuestaTexto });
  } catch (error) {
    return res.status(500).json({ error: 'Error al conectar con Gemini' });
  }
}
