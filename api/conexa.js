// api/conexa.js
// Endpoint serverless simples para receber a mensagem do Webflow, chamar a OpenAI e retornar respostas.
// Deploy em Vercel (importante: configurar OPENAI_API_KEY nas env vars do projeto no Vercel)

const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Missing message in body' });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'; // você pode alterar o modelo via env var

    if (!OPENAI_KEY) return res.status(500).json({ error: 'Server missing OPENAI_API_KEY env var' });

    // montar prompt / system + user (aqui você pode ajustar prompt base)
    const systemPrompt = `Você é a CONEXA — gere 3 respostas curtas (tom profissional, educado),
cada resposta separada e numerada; mantenha formato simples e sem tags HTML.`;

    const body = {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.8,
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(502).json({ error: 'OpenAI API error', detail: errText });
    }

    const data = await r.json();

    // extrair a mensagem principal (ajuste conforme a estrutura retornada)
    const text = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';

    // aqui estou supondo que a IA retornará 3 respostas numa única string (ex: "1) ...\n2) ...\n3) ...")
    // separa por novas linhas e tenta extrair até 3 respostas
    const parts = text.split(/\n+/).map(p => p.trim()).filter(Boolean);

    // juntar linhas até encontrar 3 blocos (simples heurística)
    const answers = [];
    let current = '';
    parts.forEach(line => {
      // se a linha começa com '1' ou '2' ou '3' com possível parêntese, começa novo bloco
      if (/^[123]\W/.test(line) && current) {
        answers.push(current.trim());
        current = line.replace(/^[123]\W+\s*/, '');
      } else {
        if (current) current += ' ' + line;
        else current = line.replace(/^[123]\W+\s*/, '');
      }
    });
    if (current) answers.push(current.trim());

    // garantir 3 respostas (se não, preencher com o que tiver)
    while (answers.length < 3) answers.push('');

    return res.json({
      raw: text,
      answers: answers.slice(0,3)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
