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
    return res.status(500).json({ error: 'Falta la API Key en Vercel' });
  }

  try {
    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: texto }] }]
      })
    });

    const data = await apiResponse.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const respuestaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta";

    return res.status(200).json({ resultado: respuestaTexto });
  } catch (error) {
    return res.status(500).json({ error: 'Error de conexión en el servidor' });
  }
}
