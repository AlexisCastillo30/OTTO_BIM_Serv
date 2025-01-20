require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

// Leemos variables de entorno
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;             // p.ej. http://localhost:8080/services/index.html
const TOKEN_URL = process.env.COGNITO_TOKEN_URL || '';     // p.ej. https://.../oauth2/token
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN;         // p.ej. https://us-east-2hjiifs5ri.auth.us-east-2.amazoncognito.com

const app = express();

// Redirige "/" a "/services/index.html"
app.get('/', (req, res) => {
  // Ajusta la ruta si tu index.html está en otro lugar
  res.redirect('/services/index.html');
});

// Rutas para LOGIN y SIGNUP
app.get('/auth/login', (req, res) => {
  // Construimos la URL del Hosted UI de Cognito
  const loginUrl = `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(loginUrl);
});

app.get('/auth/signup', (req, res) => {
  const signupUrl = `${COGNITO_DOMAIN}/signup?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(signupUrl);
});

// Ruta para LOGOUT
app.get('/auth/logout', (req, res) => {
  // Asegúrate de tener "http://localhost:8080" en Allowed sign-out URLs
  const logoutUrl = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent('http://localhost:8080')}`;
  res.redirect(logoutUrl);
});

// Intercambio code->tokens
app.get('/exchangeCode', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' });
  }

  // Construimos el body para POST /oauth2/token
  const bodyParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI
  });

  // Encabezado de Autorización (Basic Auth con clientId + clientSecret)
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

    return res.json(data); // Devolvemos los tokens en la respuesta
  } catch (err) {
    console.error('Error en /exchangeCode:', err);
    res.status(500).json({ error: 'Error exchanging code', details: err.message });
  }
});

// Servir archivos estáticos (HTML, CSS, JS, imágenes, etc.)
app.use(express.static(path.join(__dirname)));

// Iniciar servidor
app.listen(8080, () => {
  console.log('Servidor corriendo en http://localhost:8080');
});
