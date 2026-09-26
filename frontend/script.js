require('dotenv').config();

const express = require('express');
const path = require('path');
const { randomUUID } = require('node:crypto');
const OpenAI = require('openai');

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3000;
const BOT_NAME = 'Iris';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const FRONTEND_DIR = path.join(__dirname, 'frontend');

const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

app.use(express.json());
app.use('/frontend', express.static(FRONTEND_DIR));

function getBotReply(message) {
  const text = message.toLowerCase().trim();

  if (!text) {
    return `${BOT_NAME}: Posso te ajudar com o que estiver pesado hoje. Qual é o sentimento mais presente?`;
  }

  if (text.includes('ansiedade') || text.includes('nervoso') || text.includes('apavorado') || text.includes('panico') || text.includes('pânico')) {
    return `${BOT_NAME}: Parece que você está sentindo bastante tensão. Tente respirar fundo por 4 segundos inspirando e 6 segundos expirando, 5 vezes. Depois me diga: o que desencadeou essa sensação hoje?`;
  }

  if (text.includes('triste') || text.includes('deprim') || text.includes('desanim') || text.includes('sozinho') || text.includes('chorar')) {
    return `${BOT_NAME}: Sinto muito que você esteja se sentindo assim. Você não precisa resolver tudo agora. O que está mais pesado nesse momento?`;
  }

  if (text.includes('estresse') || text.includes('sobrecarreg') || text.includes('exausto') || text.includes('cansaço') || text.includes('burnout')) {
    return `${BOT_NAME}: O cansaço mental pode ser um sinal de que você está precisando de pausa e acolhimento. Que parte da sua rotina mais está pesando?`;
  }

  if (text.includes('relacion') || text.includes('namor') || text.includes('conflito') || text.includes('briga')) {
    return `${BOT_NAME}: Quando há conflitos, geralmente o que mais pesa não é só a situação, mas como ela toca suas emoções. Você consegue resumir o que aconteceu de forma breve?`;
  }

  if (text.includes('sono') || text.includes('dormir') || text.includes('insônia') || text.includes('insomnia')) {
    return `${BOT_NAME}: A mente ativa costuma atrapalhar o descanso. Talvez um ritual simples antes de dormir ajude: desligar telas, diminuir estímulos e respirar devagar. O que está dificultando seu sono?`;
  }

  if (text.includes('obrigado') || text.includes('valeu') || text.includes('ajudou')) {
    return `${BOT_NAME}: Fico feliz em poder te ouvir. Sempre que quiser continuar a conversa, estou aqui.`;
  }

  if (text.includes('oi') || text.includes('olá') || text.includes('hello') || text.includes('hey')) {
    return `${BOT_NAME}: Olá! Sou a ${BOT_NAME}, a assistente do psicologIA. Posso te ouvir e te ajudar a organizar seus pensamentos. Como você está hoje?`;
  }

  if (text.includes('raiva') || text.includes('irritado') || text.includes('furioso')) {
    return `${BOT_NAME}: Quando a raiva aparece, muitas vezes ela está sinalizando algo que precisa ser reconhecido antes de ser resolvido. O que te deixou tão agitado(a)?`;
  }

  if (text.includes('preocup') || text.includes('medo') || text.includes('insegur') || text.includes('duvida') || text.includes('dúvida')) {
    return `${BOT_NAME}: O medo e a incerteza costumam aparecer quando a mente tenta antecipar problemas. Que parte do momento atual mais te preocupa?`;
  }

  return `${BOT_NAME}: Obrigada por compartilhar isso comigo. Isso que você está sentindo parece importante e merece atenção. Pode me contar um pouco mais sobre o que está acontecendo e o que te deixou mais afetado(a)? Lembre-se: eu sou um suporte emocional, mas não substituo um profissional da saúde mental.`;
}

async function generateBotReply(message) {
  if (!openaiClient) {
    return getBotReply(message);
  }

  try {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      max_tokens: 260,
      messages: [
        {
          role: 'system',
          content: 'Você é a Iris, uma assistente acolhedora de apoio emocional em português. Responda com empatia, linguagem natural e acolhedora, sem ser dramática nem alarmista. Nunca substitua um profissional da saúde mental. Foque em escuta ativa, suporte emocional, validação e pequenas orientações práticas.'
        },
        {
          role: 'user',
          content: message
        }
      ]
    });

    const aiText = completion.choices?.[0]?.message?.content?.trim();

    if (aiText) {
      return aiText.replace(/\n{3,}/g, '\n\n').trim();
    }
  } catch (error) {
    console.error('Erro ao consultar a OpenAI:', error.message || error);
  }

  return getBotReply(message);
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    bot: BOT_NAME,
    api: openaiClient ? 'openai' : 'local',
    message: 'Servidor do psicologIA ativo.'
  });
});

app.post('/api/chat', async (req, res) => {
  const message = req.body?.message ?? '';
  const clientId = req.body?.clientId ?? req.body?.id ?? null;

  if (!message || !String(message).trim()) {
    return res.status(400).json({
      ok: false,
      error: 'Mensagem vazia. Escreva algo para conversar com o chatbot.'
    });
  }

  const reply = await generateBotReply(String(message));
  const responseId = randomUUID();

  return res.json({
    ok: true,
    response: reply,
    responseId,
    clientId,
    botName: BOT_NAME,
    source: openaiClient ? 'openai' : 'local'
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`psicologIA rodando em http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`Porta ${port} ocupada. Tentando ${port + 1}...`);
      startServer(port + 1);
      return;
    }

    throw error;
  });
}

module.exports = { app, startServer, BOT_NAME };

if (require.main === module) {
  startServer(DEFAULT_PORT);
}
