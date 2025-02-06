require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

// AWS SDK (versión 3) para DynamoDB
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
// Librería para decodificar JWT (verificarás la firma en producción)
const jwt = require('jsonwebtoken');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;       
const TOKEN_URL = process.env.COGNITO_TOKEN_URL;     
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN;   

// Ajusta la región de AWS a la de tu DynamoDB
const REGION = process.env.AWS_REGION || 'us-east-2';
const TABLE_NAME = process.env.LICENSE_TABLE_NAME || 'Licencias';

const dynamoClient = new DynamoDBClient({ region: REGION });

const app = express();

// (0) Evitar 404 en /favicon.ico
app.get('/favicon.ico', (req, res) => {
  res.sendStatus(204);
});

// (1) Redirigir a /services/index.html
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// (2) /auth/login => Hosted UI de Cognito
app.get('/auth/login', (req, res) => {
  const loginUrl = `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(loginUrl);
});

// (3) /auth/signup => Hosted UI de registro
app.get('/auth/signup', (req, res) => {
  const signupUrl = `${COGNITO_DOMAIN}/signup?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(signupUrl);
});

// (4) /auth/logout => cierra sesión en Cognito
app.get('/auth/logout', (req, res) => {
  const logoutUrl = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent('http://localhost:8080')}`;
  res.redirect(logoutUrl);
});

// (5) /exchangeCode => intercambio "code" por tokens
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
    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    // Retornamos { access_token, id_token, refresh_token, expires_in, token_type }
    return res.json(data);

  } catch (err) {
    console.error('Error en /exchangeCode:', err);
    return res.status(500).json({ error: 'Error exchanging code', details: err.message });
  }
});

// (6) /api/licenses => Devuelve licencias del usuario logueado
app.get('/api/licenses', async (req, res) => {
  try {
    // 1) Leer la cabecera Authorization
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    // 2) Extraer el token (p.ej. access_token o id_token)
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // 3) Decodificar el token para obtener sub (ID de usuario)
    let decoded;
    try {
      decoded = jwt.decode(token);
    } catch (err) {
      console.error('Error decodificando token:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Token sin sub' });
    }

    // 4) Escanear la tabla, filtrando por user_id = userId
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'user_id = :uid',
      ExpressionAttributeValues: {
        ':uid': { S: userId }
      }
    };

    // Si en tu tabla "user_id" es la PK o GSI, podrías usar QueryCommand en vez de ScanCommand
    const command = new ScanCommand(params);
    const dynamoResponse = await dynamoClient.send(command);
    const items = dynamoResponse.Items || [];

    // 5) Convertir cada Item a un objeto legible
    const licenses = items.map(item => ({
      license_id: item.license_id?.S,
      product_id: item.product_id?.S,
      expiration_date: item.expiration_date?.S,
      status: item.status?.S,
      user_id: item.user_id?.S,
      created_at: item.created_at?.S,
    }));

    return res.json(licenses);

  } catch (err) {
    console.error('Error en /api/licenses:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// (7) Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// (8) Iniciar servidor
app.listen(8080, () => {
  console.log('Servidor corriendo en http://localhost:8080');
});
