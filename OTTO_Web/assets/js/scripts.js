// scripts.js

function checkAuthAndUpdateUI() {
  // Obtenemos referencias a elementos que podrían o no existir en cada página
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const profileLink = document.getElementById('profileLink');
  const logoutBtn = document.getElementById('logoutBtn');
  const userNameSpan = document.getElementById('userNameSpan');

  // Tokens en sessionStorage
  const accessToken = sessionStorage.getItem('accessToken');
  const idToken = sessionStorage.getItem('idToken');

  // Si el elemento no existe en alguna página, simplemente lo ignoramos
  // e.g. en 'profile.html' no tenemos loginBtn ni registerBtn
  if (accessToken && idToken) {
    // Usuario logueado
    if (loginBtn)    loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (profileLink) profileLink.style.display = 'inline-block';
    if (logoutBtn)   logoutBtn.style.display = 'inline-block';

    // Podemos decodificar el idToken para mostrar el email u otro dato
    const decoded = jwt_decode(idToken);
    if (decoded && decoded.email && userNameSpan) {
      userNameSpan.textContent = decoded.email;
    } else if (userNameSpan) {
      userNameSpan.textContent = 'Usuario';
    }
  } else {
    // Usuario NO logueado
    if (loginBtn)    loginBtn.style.display = 'inline-block';
    if (registerBtn) registerBtn.style.display = 'inline-block';
    if (profileLink) profileLink.style.display = 'none';
    if (logoutBtn)   logoutBtn.style.display = 'none';
    if (userNameSpan) userNameSpan.textContent = '';
  }
}

function doLogout() {
  // Borramos los tokens de sessionStorage
  sessionStorage.clear();
  // Redirigimos al logout de Cognito
  window.location.href = '/auth/logout';
}
