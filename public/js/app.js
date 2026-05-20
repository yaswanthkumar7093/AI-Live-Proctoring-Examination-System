// Global API Base URL (Dynamic detection based on environment)
const API_BASE = window.location.origin;

// Helper to show inline alerts in auth portal
function showAuthAlert(message, isSuccess = false) {
  const alertBox = document.getElementById('auth-alert');
  if (alertBox) {
    alertBox.style.display = 'block';
    alertBox.className = `alert ${isSuccess ? 'alert-success' : 'alert-danger'}`;
    alertBox.innerText = message;
  }
}

// Register form submission
async function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;
  const registerBtn = document.getElementById('register-btn');

  registerBtn.disabled = true;
  registerBtn.innerText = 'Creating account...';

  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed.');
    }

    showAuthAlert('Account created successfully! Switching to sign in...', true);
    setTimeout(() => {
      document.getElementById('toggle-login').click();
      registerBtn.disabled = false;
      registerBtn.innerText = 'Create Account';
    }, 2000);
  } catch (error) {
    showAuthAlert(error.message);
    registerBtn.disabled = false;
    registerBtn.innerText = 'Create Account';
  }
}

// Login form submission
async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const role = document.getElementById('login-role').value;
  const loginBtn = document.getElementById('login-btn');

  loginBtn.disabled = true;
  loginBtn.innerText = 'Signing in...';

  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    // Save token and redirect
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    window.location.href = 'dashboard.html';
  } catch (error) {
    showAuthAlert(error.message);
    loginBtn.disabled = false;
    loginBtn.innerText = 'Sign In';
  }
}

// Log out user
function logout() {
  // If student is in active proctoring session, stop it first
  if (typeof stopProctoring === 'function') {
    stopProctoring();
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Load user profile & initialize dashboard panels
let currentUser = null;
async function initializeDashboard() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error('Session expired.');
    }

    currentUser = data.data;
    localStorage.setItem('user', JSON.stringify(currentUser));

    // Update Nav bar profile
    document.getElementById('user-display-name').innerText = currentUser.name;
    const roleBadge = document.getElementById('user-display-role');
    roleBadge.innerText = currentUser.role.toUpperCase();
    roleBadge.className = `user-badge ${currentUser.role}`;

    // Switch panels based on role
    if (currentUser.role === 'admin') {
      document.getElementById('admin-panel').style.display = 'block';
      document.getElementById('student-panel').style.display = 'none';
      if (typeof initAdminDashboard === 'function') {
        initAdminDashboard();
      }
    } else {
      document.getElementById('student-panel').style.display = 'block';
      document.getElementById('admin-panel').style.display = 'none';
      if (typeof initStudentDashboard === 'function') {
        initStudentDashboard();
      }
    }
  } catch (error) {
    console.error('Initialization error:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  }
}

// Automatically load dashboard when DOM is ready in dashboard.html
if (window.location.pathname.endsWith('dashboard.html')) {
  window.addEventListener('DOMContentLoaded', initializeDashboard);
}
