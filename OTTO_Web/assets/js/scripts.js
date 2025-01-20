// 1) Esperamos a que cargue el DOM
document.addEventListener("DOMContentLoaded", () => {
  console.log("Página cargada correctamente.");
});

// 2) Ver si en la URL viene "?code=..."
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const authCode = urlParams.get('code');

  if (authCode) {
    console.log("Cognito code detectado:", authCode);
    // Intercambiamos el code por tokens en tu backend
    exchangeCodeViaBackend(authCode);
  } else {
    // Si no hay code, chequear si ya hay tokens guardados
    checkAndDisplayUserInfo();
  }
});

/**
 * Llamar a /exchangeCode para obtener los tokens a partir de un "code"
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

      // Quitar el ?code= de la URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Actualizar la UI
      checkAndDisplayUserInfo();
    })
    .catch(err => {
      console.error("Error en /exchangeCode:", err);
    });
}

/**
 * checkAndDisplayUserInfo()
 * - Si tenemos un idToken => mostrar Logout y el email
 * - Si no => mostrar Login/Register
 */
function checkAndDisplayUserInfo() {
  const idToken = sessionStorage.getItem('idToken');

  // Referencias a elementos del DOM
  const loginLink = document.querySelector('.login-btn');
  const registerLink = document.querySelector('.register-btn');
  const logoutBtn = document.querySelector('.logout-btn');
  const userNameSpan = document.getElementById('userNameSpan');

  if (idToken) {
    try {
      // Decodificamos el ID Token para extraer p.ej. email
      const decoded = jwt_decode(idToken);
      console.log('ID Token decodificado:', decoded);
      if (decoded.email) {
        userNameSpan.textContent = `Usuario: ${decoded.email}`;
      }
    } catch (error) {
      console.error('Error al decodificar token:', error);
    }

    // Mostrar botón de Logout, ocultar Login/Register
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  } else {
    // No hay token => mostrar Login/Register, ocultar Logout
    userNameSpan.textContent = '';
    if (loginLink) loginLink.style.display = 'inline-block';
    if (registerLink) registerLink.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

/**
 * doLogout():
 * - Limpia tokens locales
 * - Redirige a /auth/logout (nuestro backend)
 */
function doLogout() {
  // Borrar tokens en sessionStorage
  sessionStorage.clear();
  // Redirigir a la ruta de logout en el servidor
  window.location.href = '/auth/logout';
}
