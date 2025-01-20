// assets/js/scripts.js

// 1) Esperamos a que cargue el DOM
document.addEventListener("DOMContentLoaded", () => {
  console.log("Página cargada correctamente.");
});

// 2) Detectar si hay ?code= en la URL
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const authCode = urlParams.get('code');

  if (authCode) {
    console.log("Cognito code detectado:", authCode);
    // Intercambiamos code por tokens en tu backend
    exchangeCodeViaBackend(authCode);
  } else {
    // Si no hay code, simplemente chequeamos tokens
    checkAndDisplayUserInfo();
  }
});

/**
 * Llama a /exchangeCode?code= para canjear tokens
 */
function exchangeCodeViaBackend(code) {
  fetch(`/exchangeCode?code=${code}`)
    .then(response => response.json())
    .then(data => {
      console.log("Tokens recibidos:", data);

      if (data.error) {
        console.error("Error al obtener tokens:", data.error);
        return;
      }

      // Guardar tokens en sessionStorage
      sessionStorage.setItem('accessToken', data.access_token);
      sessionStorage.setItem('idToken', data.id_token);

      // Remover el ?code= de la URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Actualizamos la UI
      checkAndDisplayUserInfo();
    })
    .catch(err => {
      console.error("Error llamando a /exchangeCode:", err);
    });
}

/**
 * checkAndDisplayUserInfo():
 * - Si tenemos idToken => ocultar Login y Register, mostrar Logout (+ email)
 * - Si no => revertir
 */
function checkAndDisplayUserInfo() {
  const idToken = sessionStorage.getItem('idToken');

  // Seleccionamos elementos
  const loginLink = document.querySelector('.login-btn');
  const registerLink = document.querySelector('.register-btn');
  const logoutBtn = document.querySelector('.logout-btn');
  const userNameSpan = document.getElementById('userNameSpan');

  if (idToken) {
    // Decodificamos el idToken para extraer email
    try {
      const decoded = jwt_decode(idToken);
      console.log('ID Token decodificado:', decoded);
      if (decoded.email) {
        userNameSpan.textContent = `Usuario: ${decoded.email}`;
      }
    } catch (error) {
      console.error('Error decodificando token:', error);
    }

    // Ocultamos Login, Register, mostramos Logout
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';

  } else {
    // Si no hay token => revertir
    userNameSpan.textContent = '';
    if (loginLink) loginLink.style.display = 'inline-block';
    if (registerLink) registerLink.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

/**
 * doLogout():
 * - Limpia tokens en sessionStorage
 * - Llama al logout de Cognito con ?logout_uri=...
 */
function doLogout() {
  sessionStorage.clear();

  const clientId = '6b5qqk9ueg4irgfqvs4ka88m4p';
  // Allowed sign-out URLs en Cognito => http://localhost:8080
  const logoutUrl = `https://us-east-2hjiifs5ri.auth.us-east-2.amazoncognito.com/logout?client_id=${clientId}&logout_uri=http://localhost:8080`;

  // Redirige a Cognito logout
  window.location.href = logoutUrl;
}
