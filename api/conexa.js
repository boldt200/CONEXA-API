// api/conexa.js
export default async function handler(req, res) {
  // GET apenas para teste rápido pelo navegador
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'API /api/conexa está funcionando' });
  }

  // Apenas POST é aceito pela sua integração real
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = req.body && Object.keys(req.body).length ? req.body : JSON.parse(req.body || '{}');
    // se quiser teste rápido, apenas devolve o texto recebido
    const prompt = body.prompt || body.mensagem || null;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt (campo "prompt" ou "mensagem")' });
    }

    // => Aqui iria a chamada para a OpenAI usando process.env.OPENAI_API_KEY
    // Por enquanto só devolvemos um echo para testar sem custo:
    return res.status(200).json({ ok: true, echo: prompt });
  } catch (err) {
    console.error('handler error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
