export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { mensagem } = req.body;
  if (!mensagem) {
    return res.status(400).json({ error: "Mensagem não enviada" });
  }

  try {
    const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é a CONEXA, especialista em atendimento humanizado." },
          { role: "user", content: mensagem }
        ]
      })
    });

    const dados = await resposta.json();
    console.log("OpenAI RAW:", dados);

    const texto = dados.choices?.[0]?.message?.content || "Erro ao gerar resposta";

    return res.status(200).json({
      resposta1: texto,
      resposta2: texto,
      resposta3: texto
    });
  } catch (e) {
    console.error("ERRO SERVIDOR:", e);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
