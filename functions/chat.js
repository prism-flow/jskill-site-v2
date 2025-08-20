// functions/chat.js
// Netlify Function para proteger seu token da OpenAI no servidor (sem senha)

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  // Só POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Use POST" }),
    };
  }

  // 🔑 Chave da OpenAI via env
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "OPENAI_API_KEY não configurada" }),
    };
  }

  // Lê payload
  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "JSON inválido" }),
    };
  }

  const { model = "gpt-4-turbo", messages = [], temperature = 0.75 } = payload;

  // Proxy para OpenAI
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model, messages, temperature }),
    });

    const text = await resp.text();
    return {
      statusCode: resp.status,
      headers: {
        "content-type": resp.headers.get("content-type") || "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: text,
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: e.message || "Erro desconhecido" }),
    };
  }
};
