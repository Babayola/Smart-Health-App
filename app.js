// ===== MAIN APPLICATION =====
(() => {
  // 1. INITIALIZE APPWRITE (ONLY DO THIS ONCE)
  const client = new Appwrite.Client();
  client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6878fa84002aa49b26a1');

  const account = new Appwrite.Account(client);
  const databases = new Appwrite.Databases(client);

  // 2. DOM ELEMENTS
  const elements = {
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
    healthForm: document.getElementById('health-form'),
    analyzeBtn: document.getElementById('analyze-btn'),
    tipsBtn: document.getElementById('tips-btn')
  };

  // 3. STATE MANAGEMENT
  let healthData = [];

  // 4. AUTHENTICATION FUNCTIONS
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
    loadHealthData();
  }

  // 5. EVENT HANDLERS
  function setupEventListeners() {
    // Auth handlers
    if (elements.loginForm) {
      elements.loginForm.addEventListener('submit', handleLogin);
    }

    if (elements.signupForm) {
      elements.signupForm.addEventListener('submit', handleSignup);
    }

    // Form toggles
    if (elements.showSignup) {
      elements.showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        if (elements.loginForm) elements.loginForm.style.display = 'none';
        if (elements.signupForm) elements.signupForm.style.display = 'block';
      });
    }

    if (elements.showLogin) {
      elements.showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        if (elements.signupForm) elements.signupForm.style.display = 'none';
        if (elements.loginForm) elements.loginForm.style.display = 'block';
      });
    }

    // Health data handlers
    if (elements.healthForm) {
      elements.healthForm.addEventListener('submit', handleHealthSubmit);
    }

    if (elements.analyzeBtn) {
      elements.analyzeBtn.addEventListener('click', handleAnalyze);
    }

    if (elements.tipsBtn) {
      elements.tipsBtn.addEventListener('click', handleGetTips);
    }
  }

  // 6. CORE FUNCTIONALITY
  async function handleLogin(e) {
    e.preventDefault();
    try {
      await account.createEmailSession(
        elements.loginEmail.value,
        elements.loginPassword.value
      );
      const user = await account.get();
      showDashboard(user);
    } catch (error) {
      alert("Login failed: " + error.message);
      console.error(error);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    try {
      await account.create(
        'unique()',
        elements.signupEmail.value,
        elements.signupPassword.value,
        elements.signupName.value
      );
      await handleLogin(e); // Auto-login after signup
    } catch (error) {
      alert("Signup failed: " + error.message);
      console.error(error);
    }
  }

  async function handleHealthSubmit(e) {
    e.preventDefault();
    try {
      await databases.createDocument(
        'health_db',
        'health_records',
        'unique()',
        {
          heartRate: document.getElementById('heartRate').value,
          bloodPressure: document.getElementById('bloodPressure').value,
          bloodOxygen: document.getElementById('bloodOxygen').value,
          weight: document.getElementById('weight').value || null,
          temperature: document.getElementById('temperature').value || null,
          bloodSugar: document.getElementById('bloodSugar').value || null,
          notes: document.getElementById('notes').value || '',
          timestamp: new Date().toISOString()
        }
      );
      alert('Data saved successfully!');
      loadHealthData();
    } catch (error) {
      alert('Failed to save data');
      console.error(error);
    }
  }

  async function loadHealthData() {
    try {
      const response = await databases.listDocuments(
        'health_db',
        'health_records',
        [],
        20,
        undefined,
        undefined,
        undefined,
        'timestamp'
      );
      healthData = response.documents;
      updateChart();
    } catch (error) {
      console.error("Error loading health data:", error);
    }
  }

  // 7. INITIALIZATION
  setupEventListeners();
  checkAuth();
})();