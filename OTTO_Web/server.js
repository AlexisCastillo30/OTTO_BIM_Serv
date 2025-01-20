// server.js (resumido)
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:8080';
const TOKEN_URL = process.env.COGNITO_TOKEN_URL || '';

const app = express();

// Redirige "/" a "/services/index.html"
app.get('/', (req, res) => {
  res.redirect('/services/index.html');
});

// Servir estáticos
app.use(express.static(path.join(__dirname)));

// Intercambio code->tokens
app.get('/exchangeCode', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' });
  }
  const bodyParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI
  });
  const authHeaderValue = 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeaderValue
      },
      body: bodyParams.toString()
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('Error en /exchangeCode:', err);
    res.status(500).json({ error: 'Error exchanging code', details: err.message });
  }
});

app.listen(8080, () => {
  console.log('Servidor corriendo en http://localhost:8080');
});
