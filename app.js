// ===== COMPLETE WORKING APP.JS =====
(() => {
  // 1. INITIALIZE APPWRITE
  const client = new Appwrite.Client();
  client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6878fa84002aa49b26a1');

  const account = new Appwrite.Account(client);
  const databases = new Appwrite.Databases(client);

  // 2. DOM ELEMENTS
  const elements = {
    // Auth
    authContainer: document.getElementById('auth-container'),
    dashboard: document.getElementById('dashboard'),
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    signupName: document.getElementById('signup-name'),
    signupEmail: document.getElementById('signup-email'),
    signupPassword: document.getElementById('signup-password'),
    showSignup: document.getElementById('show-signup'),
    showLogin: document.getElementById('show-login'),
    
    // Health Data
    healthForm: document.getElementById('health-form'),
    heartRate: document.getElementById('heartRate'),
    bloodPressure: document.getElementById('bloodPressure'),
    bloodOxygen: document.getElementById('bloodOxygen'),
    weight: document.getElementById('weight'),
    temperature: document.getElementById('temperature'),
    bloodSugar: document.getElementById('bloodSugar'),
    notes: document.getElementById('notes'),
    analyzeBtn: document.getElementById('analyze-btn'),
    tipsBtn: document.getElementById('tips-btn'),
    insightsContainer: document.getElementById('insights-container'),
    tipsContainer: document.getElementById('tips-container')
  };

  // 3. AUTHENTICATION
  async function checkAuth() {
    try {
      const user = await account.get();
      showDashboard(user);
    } catch {
      showAuth();
    }
  }

  function showAuth() {
    if (elements.authContainer) elements.authContainer.style.display = 'block';
    if (elements.dashboard) elements.dashboard.style.display = 'none';
  }

  function showDashboard(user) {
    if (elements.authContainer) elements.authContainer.style.display = 'none';
    if (elements.dashboard) elements.dashboard.style.display = 'block';
    console.log("User logged in:", user);
  }

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const session = await account.createEmailSession(
        elements.loginEmail.value,
        elements.loginPassword.value
      );
      console.log("Login success:", session);
      const user = await account.get();
      showDashboard(user);
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    try {
      const user = await account.create(
        'unique()',
        elements.signupEmail.value,
        elements.signupPassword.value,
        elements.signupName.value
      );
      console.log("Signup success:", user);
      await handleLogin(e); // Auto-login
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed: " + error.message);
    }
  }

  // 4. HEALTH DATA
  async function handleHealthSubmit(e) {
    e.preventDefault();
    try {
      const user = await account.get();
      const doc = await databases.createDocument(
        'health_db',
        'health_records',
        'unique()',
        {
          userId: user.$id,
          heartRate: elements.heartRate.value,
          bloodPressure: elements.bloodPressure.value,
          bloodOxygen: elements.bloodOxygen.value,
          timestamp: new Date().toISOString()
        }
      );
      console.log("Data saved:", doc);
      alert('Data saved!');
      elements.healthForm.reset();
    } catch (error) {
      console.error("Save error:", error);
      alert('Save failed: ' + error.message);
    }
  }

  // 5. EVENT LISTENERS
  function setupListeners() {
    // Auth
    if (elements.loginForm) elements.loginForm.addEventListener('submit', handleLogin);
    if (elements.signupForm) elements.signupForm.addEventListener('submit', handleSignup);
    
    // Form toggles
    if (elements.showSignup) elements.showSignup.addEventListener('click', (e) => {
      e.preventDefault();
      if (elements.loginForm) elements.loginForm.style.display = 'none';
      if (elements.signupForm) elements.signupForm.style.display = 'block';
    });
    
    if (elements.showLogin) elements.showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      if (elements.signupForm) elements.signupForm.style.display = 'none';
      if (elements.loginForm) elements.loginForm.style.display = 'block';
    });

    // Health Data
    if (elements.healthForm) elements.healthForm.addEventListener('submit', handleHealthSubmit);
  }

  // 6. INITIALIZE
  setupListeners();
  checkAuth();
})();