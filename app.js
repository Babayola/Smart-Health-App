// ===== UPDATED APP.JS CONTENT (Adding Weight Metric) =====
// This file should be named app.js and linked from index.html: <script src="app.js"></script>

console.log("App.js version: 2025-08-05_16:00 - Adding Weight Metric"); // Updated for confirmation

(() => {
  // 1. INITIALIZE APPWRITE
  const client = new Appwrite.Client();
  client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6878fa84002aa49b26a1'); // DOUBLE-CHECK THIS IS YOUR CORRECT PROJECT ID IN APPWRITE CONSOLE!

  const account = new Appwrite.Account(client);
  const databases = new Appwrite.Databases(client);

  // Appwrite Database and Collection IDs (copied from your previous interactions)
  const DATABASE_ID = '687a0e5a0031f474d1c7';
  const COLLECTION_ID = '687a0e65000b8a2d846c';

  let heartRateChartInstance = null;
  
  // 2. DOM ELEMENTS
  const elements = {
    // Auth
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
    
    // Health Data
    healthForm: document.getElementById('health-form'),
    heartRate: document.getElementById('heartRate'),
    bloodPressure: document.getElementById('bloodPressure'),
    bloodOxygen: document.getElementById('bloodOxygen'),
    weight: document.getElementById('weight'), // Added new weight element
    insightsContainer: document.getElementById('insights-container'),
    tipsContainer: document.getElementById('tips-container'),
    heartRateChartCanvas: document.getElementById('health-chart')
  };

  for (const key in elements) {
    if (!elements[key] && key !== 'bloodOxygenChartCanvas') { // bloodOxygenChartCanvas is not directly in HTML
      console.error(`CRITICAL ERROR: DOM element '${key}' not found! Check your HTML IDs.`);
    }
  }

  // 3. AUTHENTICATION FUNCTIONS
  async function checkAuth() {
    console.log("checkAuth called.");
    try {
      const user = await account.get();
      console.log("checkAuth: User found:", user); 
      showDashboard(user);
      handleAnalyzeData(); 
      handleGetTips();
      if (elements.logoutBtn) elements.logoutBtn.style.display = 'block'; 
    } catch (error) { 
      console.log("checkAuth: User not authenticated or session invalid. Error:", error); 
      showAuth();
      if (elements.logoutBtn) elements.logoutBtn.style.display = 'none'; 
    }
  }

  function showAuth() {
    console.log("showAuth called. Displaying login/signup forms.");
    if (elements.authContainer) elements.authContainer.style.display = 'block';
    if (elements.dashboard) elements.dashboard.style.display = 'none';
    const loginFormDiv = document.getElementById('login-form');
    const signupFormDiv = document.getElementById('signup-form');
    if (loginFormDiv) loginFormDiv.style.display = 'block';
    if (signupFormDiv) signupFormDiv.style.display = 'none';
    if (elements.logoutBtn) elements.logoutBtn.style.display = 'none'; 
  }

  function showDashboard(user) {
    console.log("showDashboard called. User:", user);
    if (elements.authContainer) elements.authContainer.style.display = 'none';
    if (elements.dashboard) elements.dashboard.style.display = 'block'; 
    if (elements.logoutBtn) elements.logoutBtn.style.display = 'block'; 
  }

  async function handleLogin(e) {
    e.preventDefault();
    console.log("Login form submitted.");
    try {
      const session = await account.createEmailPasswordSession(
        elements.loginEmail.value,
        elements.loginPassword.value
      );
      console.log("Login success. Session:", session);
      const user = await account.get();
      showDashboard(user);
      handleAnalyzeData(); 
      handleGetTips();     
      alert("Login successful!");
      if (elements.logoutBtn) elements.logoutBtn.style.display = 'block'; 
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    console.log("Signup form submitted.");
    try {
      const user = await account.create(
        Appwrite.ID.unique(), 
        elements.signupEmail.value,
        elements.signupPassword.value,
        elements.signupName.value
      );
      console.log("Signup success. User:", user);
      
      await account.createEmailPasswordSession(
        elements.signupEmail.value,
        elements.signupPassword.value
      );
      
      const currentUser = await account.get();
      showDashboard(currentUser);
      handleAnalyzeData(); 
      handleGetTips();     
      alert("Account created and logged in!");
      if (elements.logoutBtn) elements.logoutBtn.style.display = 'block'; 
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed: " + error.message);
    }
  }

  async function handleLogout() {
    console.log("Logout button clicked.");
    try {
        await account.deleteSession('current'); 
        console.log("Logout successful.");
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

  // 4. HEALTH DATA FUNCTIONS
  async function handleHealthSubmit(e) {
    e.preventDefault();
    console.log("Health form submitted.");
    try {
      const user = await account.get(); 
      const doc = await databases.createDocument(
        DATABASE_ID,   
        COLLECTION_ID,   
        Appwrite.ID.unique(),     
        {
          userId: user.$id, 
          heartRate: parseInt(elements.heartRate.value),
          bloodPressure: elements.bloodPressure.value,
          bloodOxygen: parseInt(elements.bloodOxygen.value),
          weight: parseInt(elements.weight.value), // Added new weight value
          timestamp: new Date().toISOString() 
        },
        [ 
          Appwrite.Permission.read(Appwrite.Role.user(user.$id)),
          Appwrite.Permission.write(Appwrite.Role.user(user.$id))
        ]
      );
      console.log("Data saved:", doc);
      alert('Health data saved successfully!');
      elements.healthForm.reset();
      handleAnalyzeData(); 
      handleGetTips(); 
    } catch (error) {
      console.error("Save data error:", error);
      console.log('Full Appwrite error object:', error); 
      alert('Error saving data: ' + error.message);
    }
  }

  // --- CHART RENDERING FUNCTION ---
  function renderHealthCharts(records) {
    if (!elements.heartRateChartCanvas) {
      console.error("Heart Rate Chart Canvas not found.");
      return;
    }
    
    // Reverse records to display oldest to newest on chart
    const sortedRecords = records.slice().reverse(); 

    const labels = sortedRecords.map(record => {
      const date = new Date(record.timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const heartRateData = sortedRecords.map(record => record.heartRate);
    const bloodOxygenData = sortedRecords.map(record => record.bloodOxygen);
    const weightData = sortedRecords.map(record => record.weight); // Added new weight data

    // Destroy existing chart instance if it exists
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
            label: 'Weight (kg)', // Added new weight dataset
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
    console.log("Analyze Data triggered.");
    if (!elements.insightsContainer) {
      console.error("Insights container not found.");
      return;
    }

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
      console.log("Fetched records for analysis:", records);

      if (records.length === 0) {
        elements.insightsContainer.innerHTML = '<p>No health records found. Submit some data to get insights!</p>';
        if (heartRateChartInstance) heartRateChartInstance.destroy(); 
        return;
      }

      let totalHeartRate = 0;
      let minHeartRate = 200; // Initialize high
      let maxHeartRate = 40;  // Initialize low

      let totalBloodOxygen = 0;
      let minBloodOxygen = 100; // Initialize high
      let maxBloodOxygen = 80;  // Initialize low

      let totalWeight = 0; // Added new weight variables
      let minWeight = 500;
      let maxWeight = 0;

      let latestBloodPressure = 'N/A'; 

      records.forEach((record, index) => {
        // Heart Rate
        totalHeartRate += record.heartRate;
        minHeartRate = Math.min(minHeartRate, record.heartRate);
        maxHeartRate = Math.max(maxHeartRate, record.heartRate);

        // Blood Oxygen
        totalBloodOxygen += record.bloodOxygen;
        minBloodOxygen = Math.min(minBloodOxygen, record.bloodOxygen);
        maxBloodOxygen = Math.max(maxBloodOxygen, record.bloodOxygen);

        // Weight
        if (record.weight) { // Check if the record has weight data
            totalWeight += record.weight;
            minWeight = Math.min(minWeight, record.weight);
            maxWeight = Math.max(maxWeight, record.weight);
        }

        if (index === 0) { 
          latestBloodPressure = record.bloodPressure;
        }
      });

      const avgHeartRate = (totalHeartRate / records.length).toFixed(0);
      const avgBloodOxygen = (totalBloodOxygen / records.length).toFixed(0);
      const avgWeight = totalWeight > 0 ? (totalWeight / records.filter(r => r.weight).length).toFixed(0) : 'N/A'; // Added new average weight

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
      console.error("Error fetching or analyzing data:", error);
      elements.insightsContainer.innerHTML = '<p>Error loading insights. Please try again.</p>';
      if (error.code === 401) {
         elements.insightsContainer.innerHTML += '<p><strong>Permission Denied:</strong> Ensure "Read Documents" is enabled for "Any (logged in) user" on your collection in Appwrite.</p>';
      } else if (error.code === 404) {
          elements.insightsContainer.innerHTML += '<p>Database or Collection not found. Check IDs in app.js.</p>';
      } else {
        elements.insightsContainer.innerHTML += `<p>Error details: ${error.message}</p>`;
      }
      if (heartRateChartInstance) heartRateChartInstance.destroy(); 
    }
  }

  // --- ENHANCED GET TIPS FUNCTION ---
  async function handleGetTips() {
    console.log("Get Tips triggered.");
    if (!elements.tipsContainer) {
      console.error("Tips container not found.");
      return;
    }

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
                Appwrite.Query.limit(5) // Get latest 5 records for quick check
            ]
        );
        const records = response.documents;

        if (records.length > 0) {
            const latestHR = records[0].heartRate;
            const latestBO = records[0].bloodOxygen;
            const latestBP = records[0].bloodPressure; // e.g., "120/80"
            const latestWeight = records[0].weight; // Get latest weight
            const [systolic, diastolic] = latestBP.split('/').map(Number);

            // Personalized Tips based on thresholds
            // These are simplified thresholds and should be medically validated for real apps
            if (latestHR > 90) { // Resting HR usually < 90
                personalizedTips.push("Your recent heart rate is a bit high. Consider stress reduction techniques like deep breathing or meditation.");
            } else if (latestHR < 60 && latestHR > 0) { // Below 60 for non-athletes
                personalizedTips.push("Your heart rate seems low. If you're not an athlete, consult a doctor if you feel symptoms like dizziness.");
            }

            if (latestBO < 95) { // Below 95 is generally low for healthy individuals
                personalizedTips.push("Your recent blood oxygen is on the lower side. Try some deep breathing exercises throughout the day.");
            }

            if (systolic >= 130 || diastolic >= 80) { // Pre-hypertensive or hypertensive
                personalizedTips.push("Your recent blood pressure readings suggest you might be approaching or in the high range. Focus on a low-sodium diet and regular exercise.");
            } else if (systolic < 90 || diastolic < 60) { // Low blood pressure
                personalizedTips.push("Your blood pressure appears low. Ensure you're well-hydrated and discuss with a doctor if you experience dizziness.");
            }
            
            // New personalized tip for weight
            if (latestWeight > 90) { // Example threshold, you can change this
                personalizedTips.push("Your recent weight reading is high. Focusing on a balanced diet and increasing physical activity can help.");
            }
        }
    } catch (error) {
        console.error("Error fetching data for personalized tips:", error);
        // Fallback to generic tips if data fetch fails
    }

    // Generic tips (always available)
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
        personalizedTips.forEach(tip => {
            tipsHtml += `<li style="font-weight: bold; color: var(--primary);">${tip}</li>`;
        });
        tipsHtml += '</ul><h4>General Tips:</h4><ul>';
    } else {
        tipsHtml += '<ul>';
    }

    tips.forEach(tip => {
        tipsHtml += `<li>${tip}</li>`;
    });
    tipsHtml += '</ul>';

    elements.tipsContainer.innerHTML = tipsHtml;
  }

  // 5. EVENT LISTENERS SETUP
  function setupListeners() {
    // Auth
    if (elements.loginForm) elements.loginForm.addEventListener('submit', handleLogin);
    if (elements.signupForm) elements.signupForm.addEventListener('submit', handleSignup);
    if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', handleLogout); 
    
    // Form toggles
    if (elements.showSignup) elements.showSignup.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('signup-form').style.display = 'block';
    });
    
    if (elements.showLogin) elements.showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('signup-form').style.display = 'none';
      document.getElementById('login-form').style.display = 'block';
    });

    // Health Data
    if (elements.healthForm) elements.healthForm.addEventListener('submit', handleHealthSubmit);
  }

  // 6. INITIALIZE APP
  document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Initializing App.");
    setupListeners();
    checkAuth(); 
  });

})(); // End of IIFE