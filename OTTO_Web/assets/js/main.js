// main.js

const loginBtn = document.getElementById('login');

try {
  // 1) Llamamos a un endpoint local: /api/auth/profile
  //    Devuelve { name, email, etc. } si el user está logueado, 
  //    o 401 / 403 / algo si no lo está
  const resp = await fetch('/api/auth/profile');
  if (resp.ok) {
    // Usuario logueado => Modo "Logout"
    const user = await resp.json();
    loginBtn.innerText = `Logout (${user.name})`;
    loginBtn.onclick = () => {
      // 2) Para desloguear, a) mandar al logout local 
      //    (que internamente llama al logout de Cognito)
      window.location.replace('/api/auth/logout');
    };
  } else {
    // Usuario no logueado => Modo "Login"
    loginBtn.innerText = 'Login';
    loginBtn.onclick = () => {
      // 3) Redirigir a /api/auth/login => tu back-end redirige a Cognito
      window.location.replace('/api/auth/login');
    };
  }
  // Una vez configurado, lo mostramos
  loginBtn.style.visibility = 'visible';

} catch (err) {
  alert('No se pudo inicializar la aplicación.');
  console.error(err);
}
