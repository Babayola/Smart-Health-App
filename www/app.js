// ===== COMPLETE AND FINAL APP.JS (For AdMob & Mobile Deployment) =====
import { AdMob } from '@admob-plus/capacitor'; // <-- NEW: Import AdMob library

console.log("App.js version: 2025-09-28_18:15 - FINAL COMPLETE CODE"); 

document.addEventListener('DOMContentLoaded', () => {

  // --- CONFIGURATION CONSTANTS ---
  const DATABASE_ID = '687a0e5a0031f474d1c7';
  const COLLECTION_ID = '687a0e65000b8a2d846c';
  const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-9239900240710331/2391487590'; // YOUR INTERSTITIAL ID

  // 1. INITIALIZE APPWRITE
  const client = new Appwrite.Client();
  client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6878fa84002aa49b26a1');

  const account = new Appwrite.Account(client);
  const databases = new Appwrite.Databases(client);

  let heartRateChartInstance = null;
  
  // 2. DOM ELEMENTS
  const elements = {
    authContainer: document.getElementById('auth-container'),
    dashboard: document.getElementById('dashboard'),
    loginForm: document.getElementById('login-form-data'),
    signupForm: document.getElementById('signup-form-data'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    signupName: document.getElementById('signup-name'),
    signupEmail: document.getElementById('signup-email'),
    signupPassword: document.getElementById('signup-password'),
    showSignup: document.getElementById('show-signup'),
    showLogin: document.getElementById('show-login'),
    logoutBtn: document.getElementById('logout-btn'), 
    
    healthForm: document.getElementById('health-form'),
    heartRate: document.getElementById('heartRate'),
    bloodPressure: document.getElementById('bloodPressure'),
    bloodOxygen: document.getElementById('bloodOxygen'),
    weight: document.getElementById('weight'),
    insightsContainer: document.getElementById('insights-container'),
    tipsContainer: document.getElementById('tips-container'),
    heartRateChartCanvas: document.getElementById('health-chart'),
    tipsBtn: document.getElementById('tips-btn') 
  };

  // 3. ADMOB PRELOAD FUNCTION
  async function preloadAdMobInterstitial() {
      try {
          // Use test ads until final submission: isTesting: true
          await AdMob.prepareInterstitial({
              adId: INTERSTITIAL_AD_UNIT_ID,
              isTesting: true,
          });
          console.log("AdMob Interstitial Preloaded.");
      } catch (e) {
          console.warn('AdMob Preload Failed:', e);
      }
  }


  // 4. AUTHENTICATION FUNCTIONS
  async function checkAuth() {
    try {
      const user = await account.get();
      showDashboard(user);
      handleAnalyzeData(); 
      handleGetTips();
      preloadAdMobInterstitial(); // Preload ad on initial load
    } catch (error) { 
      showAuth();
    }
  }

  function showAuth() {
    if (elements.authContainer) elements.authContainer.style.display = 'block';
    if (elements.dashboard) elements.dashboard.style.display = 'none';
    const loginFormDiv = document.getElementById('login-form');
    const signupFormDiv = document.getElementById('signup-form');
    if (loginFormDiv) loginFormDiv.style.display = 'block';
    if (signupFormDiv) signupFormDiv.style.display = 'none';
    if (elements.logoutBtn) elements.logoutBtn.style.display = 'none'; 
  }

  function showDashboard(user) {
    if (elements.authContainer) elements.authContainer.style.display = 'none';
    if (elements.dashboard) elements.dashboard.style.display = 'block'; 
    if (elements.logoutBtn) elements.logoutBtn.style.display = 'inline-block'; 
    
    // Adsense is removed. This spot is reserved for Banner Ads or other mobile placement.
  }

  async function handleLogin(e) {
    e.preventDefault();
    try {
      await account.createEmailPasswordSession(elements.loginEmail.value, elements.loginPassword.value);
      const user = await account.get();
      showDashboard(user);
      handleAnalyzeData(); 
      handleGetTips(); 
      alert("Login successful!");
      preloadAdMobInterstitial(); 
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    try {
      await account.create(Appwrite.ID.unique(), elements.signupEmail.value, elements.signupPassword.value, elements.signupName.value);
      await account.createEmailPasswordSession(elements.signupEmail.value, elements.signupPassword.value);
      const currentUser = await account.get();
      showDashboard(currentUser);
      handleAnalyzeData(); 
      handleGetTips(); 
      alert("Account created and logged in!");
      preloadAdMobInterstitial(); 
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed: " + error.message);
    }
  }

  async function handleLogout() {
    try {
        await account.deleteSession('current'); 
        alert("You have been logged out.");
        showAuth(); 
        if (elements.insightsContainer) elements.insightsContainer.innerHTML = '<p>Login and submit data to get insights</p>';
        if (elements.tipsContainer) elements.tipsContainer.innerHTML = '<p>Login to get personalized health tips</p>';
        if (heartRateChartInstance) heartRateChartInstance.destroy();
    } catch (error) {
        console.error("Logout error:", error);
        alert("Error logging out: " + error.message);
    }
  }

  // 5. HEALTH DATA FUNCTIONS
  async function handleHealthSubmit(e) {
    e.preventDefault();
    
    // --- ADMOB: SHOW AD BEFORE DATA PROCESSING ---
    try {
        // 1. Show the ad (it will appear if preloaded and ready)
        await AdMob.showInterstitial(); 
        
        // 2. IMPORTANT: Preload the next ad while the user is interacting with the current one
        preloadAdMobInterstitial();
    } catch (adError) {
        // If the ad fails to show (e.g., ad not loaded), we log it but continue the core app process.
        console.warn("Interstitial ad failed to show, continuing data submission.", adError);
    }
    // ---------------------------------------------
    
    try {
      const user = await account.get(); 
      await databases.createDocument(
        DATABASE_ID,   
        COLLECTION_ID,   
        Appwrite.ID.unique(),     
        {
          userId: user.$id, 
          heartRate: parseInt(elements.heartRate.value),
          bloodPressure: elements.bloodPressure.value,
          bloodOxygen: parseInt(elements.bloodOxygen.value),
          weight: parseInt(elements.weight.value), 
          timestamp: new Date().toISOString() 
        },
        [ 
          Appwrite.Permission.read(Appwrite.Role.user(user.$id)),
          Appwrite.Permission.write(Appwrite.Role.user(user.$id))
        ]
      );
      alert('Health data saved successfully!');
      elements.healthForm.reset();
      handleAnalyzeData(); 
      handleGetTips(); 
    } catch (error) {
      console.error("Save data error:", error);
      alert('Error saving data: ' + error.message);
    }
  }

  // --- CHART RENDERING FUNCTION ---
  function renderHealthCharts(records) {
    if (!elements.heartRateChartCanvas) return;
    
    const sortedRecords = records.slice().reverse(); 
    const labels = sortedRecords.map(record => {
      const date = new Date(record.timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const heartRateData = sortedRecords.map(record => record.heartRate);
    const bloodOxygenData = sortedRecords.map(record => record.bloodOxygen);
    const weightData = sortedRecords.map(record => record.weight); 

    if (heartRateChartInstance) heartRateChartInstance.destroy();

    const ctx = elements.heartRateChartCanvas.getContext('2d');
    heartRateChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Heart Rate (bpm)',
            data: heartRateData,
            borderColor: '#FF6384',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.1,
            fill: false
          },
          {
            label: 'Blood Oxygen (%)',
            data: bloodOxygenData,
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.1,
            fill: false
          },
          {
            label: 'Weight (kg)', 
            data: weightData,
            borderColor: '#9966FF',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            tension: 0.1,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Health Metrics Over Time (Last 10 Records)'
          }
        }
      }
    });
  }

  // --- ENHANCED ANALYSIS FUNCTION ---
  async function handleAnalyzeData() {
    if (!elements.insightsContainer) return;

    try {
      const user = await account.get(); 
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Appwrite.Query.equal('userId', user.$id), 
          Appwrite.Query.orderDesc('timestamp'),    
          Appwrite.Query.limit(10)                  
        ]
      );
      
      const records = response.documents;

      if (records.length === 0) {
        elements.insightsContainer.innerHTML = '<p>No health records found. Submit some data to get insights!</p>';
        if (heartRateChartInstance) heartRateChartInstance.destroy(); 
        return;
      }

      let totalHeartRate = 0, minHeartRate = 200, maxHeartRate = 40;
      let totalBloodOxygen = 0, minBloodOxygen = 100, maxBloodOxygen = 80;
      let totalWeight = 0, minWeight = 500, maxWeight = 0, weightCount = 0;
      let latestBloodPressure = 'N/A'; 

      records.forEach((record, index) => {
        totalHeartRate += record.heartRate;
        minHeartRate = Math.min(minHeartRate, record.heartRate);
        maxHeartRate = Math.max(maxHeartRate, record.heartRate);
        totalBloodOxygen += record.bloodOxygen;
        minBloodOxygen = Math.min(minBloodOxygen, record.bloodOxygen);
        maxBloodOxygen = Math.max(maxBloodOxygen, record.bloodOxygen);

        if (record.weight) { 
            totalWeight += record.weight;
            minWeight = Math.min(minWeight, record.weight);
            maxWeight = Math.max(maxWeight, record.weight);
            weightCount++;
        }

        if (index === 0) { 
          latestBloodPressure = record.bloodPressure;
        }
      });

      const avgHeartRate = (totalHeartRate / records.length).toFixed(0);
      const avgBloodOxygen = (totalBloodOxygen / records.length).toFixed(0);
      const avgWeight = weightCount > 0 ? (totalWeight / weightCount).toFixed(0) : 'N/A';

      let insightsHtml = `
        <h3>Your Health Insights (${records.length} records analyzed):</h3>
        <ul>
          <li><strong>Heart Rate (bpm):</strong> Avg ${avgHeartRate}, Min ${minHeartRate}, Max ${maxHeartRate}</li>
          <li><strong>Blood Pressure:</strong> Latest ${latestBloodPressure} mmHg</li>
          <li><strong>Blood Oxygen (%):</strong> Avg ${avgBloodOxygen}, Min ${minBloodOxygen}, Max ${maxBloodOxygen}</li>
          <li><strong>Weight (kg):</strong> Avg ${avgWeight}, Min ${minWeight}, Max ${maxWeight}</li>
        </ul>
      `;
      
      elements.insightsContainer.innerHTML = insightsHtml;
      renderHealthCharts(records);
    } catch (error) {
      elements.insightsContainer.innerHTML = '<p>Error loading insights. Please try again.</p>';
      if (heartRateChartInstance) heartRateChartInstance.destroy(); 
    }
  }

  // --- ENHANCED GET TIPS FUNCTION ---
  async function handleGetTips() {
    if (!elements.tipsContainer) return;

    let tips = [];
    let personalizedTips = [];

    try {
        const user = await account.get();
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [
                Appwrite.Query.equal('userId', user.$id),
                Appwrite.Query.orderDesc('timestamp'),
                Appwrite.Query.limit(5)
            ]
        );
        const records = response.documents;

        if (records.length > 0) {
            const latestHR = records[0].heartRate;
            const latestBO = records[0].bloodOxygen;
            const latestBP = records[0].bloodPressure;
            const latestWeight = records[0].weight;
            const [systolic, diastolic] = latestBP.split('/').map(Number);

            if (latestHR > 90) personalizedTips.push("Your recent heart rate is a bit high. Consider stress reduction techniques like deep breathing or meditation.");
            else if (latestHR < 60 && latestHR > 0) personalizedTips.push("Your heart rate seems low. If you're not an athlete, consult a doctor if you feel symptoms like dizziness.");
            if (latestBO < 95) personalizedTips.push("Your recent blood oxygen is on the lower side. Try some deep breathing exercises throughout the day.");
            if (systolic >= 130 || diastolic >= 80) personalizedTips.push("Your recent blood pressure readings suggest you might be approaching or in the high range. Focus on a low-sodium diet and regular exercise.");
            else if (systolic < 90 || diastolic < 60) personalizedTips.push("Your blood pressure appears low. Ensure you're well-hydrated and discuss with a doctor if you experience dizziness.");
            if (latestWeight > 90) personalizedTips.push("Your recent weight reading is high. Focusing on a balanced diet and increasing physical activity can help.");
        }
    } catch (error) {
        console.error("Error fetching data for personalized tips:", error);
    }

    tips.push("Aim for at least 30 minutes of moderate exercise most days of the week.");
    tips.push("Eat a balanced diet rich in fruits, vegetables, and whole grains.");
    tips.push("Stay hydrated by drinking plenty of water throughout the day.");
    tips.push("Prioritize 7-9 hours of quality sleep each night.");
    tips.push("Manage stress through meditation, deep breathing, or hobbies.");
    tips.push("Limit processed foods, sugary drinks, and excessive sodium intake.");
    tips.push("Regularly monitor your vital signs and consult a doctor for concerns.");

    let tipsHtml = '<h3>Quick Health Tips:</h3>';
    if (personalizedTips.length > 0) {
        tipsHtml += '<h4>Personalized Suggestions:</h4><ul>';
        personalizedTips.forEach(tip => tipsHtml += `<li style="font-weight: bold; color: var(--primary);">${tip}</li>`);
        tipsHtml += '</ul><h4>General Tips:</h4><ul>';
    } else {
        tipsHtml += '<ul>';
    }

    tips.forEach(tip => tipsHtml += `<li>${tip}</li>`);
    tipsHtml += '</ul>';

    elements.tipsContainer.innerHTML = tipsHtml;
  }

  function setupListeners() {
    if (elements.loginForm) elements.loginForm.addEventListener('submit', handleLogin);
    if (elements.signupForm) elements.signupForm.addEventListener('submit', handleSignup);
    if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', handleLogout); 
    if (elements.showSignup) elements.showSignup.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('login-form').style.display = 'none';
      document.