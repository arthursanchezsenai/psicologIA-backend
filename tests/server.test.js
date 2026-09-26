const test = require('node:test');
const assert = require('node:assert/strict');

const serverModule = require('../server.js');

const getResponse = (path, options = {}) => new Promise((resolve, reject) => {
  const server = serverModule.app.listen(0, () => {
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    fetch(`${baseUrl}${path}`, options)
      .then(async (response) => {
        const body = await response.text();
        resolve({ status: response.status, body, headers: response.headers });
      })
      .catch(reject)
      .finally(() => {
        server.close();
      });
  });
});

test('server exports app', () => {
  assert.ok(serverModule.app, 'O servidor deve exportar o app Express para testes.');
});

test('health endpoint responds with ok status', async () => {
  const response = await getResponse('/api/health');

  assert.equal(response.status, 200);
  const body = JSON.parse(response.body);
  assert.equal(body.ok, true);
  assert.equal(body.bot, 'Iris');
});

test('chat endpoint accepts a message and returns a text response', async () => {
  const response = await getResponse('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Estou muito ansioso hoje' })
  });

  assert.equal(response.status, 200);
  const body = JSON.parse(response.body);
  assert.equal(body.ok, true);
  assert.ok(body.response.length > 0);
});
