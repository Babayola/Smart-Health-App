// Line 1: Start of the file
console.log("App.js version: 2025-10-11 - FINAL INTEGRATED FIXES (V2)"); 

// --- 1. ADMOB SAFETY WRAPPER ---
document.addEventListener('DOMContentLoaded', () => {
    
    // FIX 1 (Web App Login Fix): Use window.AdMob to robustly check for the Capacitor plugin's presence.
    // This prevents the web browser from crashing on mobile-only AdMob code.
    if (window.AdMob) {
        initializeAdMobLogic();
    } else {
        console.warn("AdMob plugin not detected. Running core app logic only.");
        // Pass the global Appwrite object (available from index.html)
        initializeCoreAppLogic(Appwrite); 
    }
});


// --- 2. ADMOB INITIALIZATION FUNCTION ---
function initializeAdMobLogic() {
    AdMob.initialize({
        testing: true,
    }).then(() => {
        console.log("AdMob plugin initialized successfully. Starting core app.");
        // Pass the global Appwrite object
        initializeCoreAppLogic(Appwrite); 
        preloadAdMobInterstitial();
    }).catch(e => {
        console.error("AdMob initialization failed:", e);
        // Fallback: If initialization fails, still start the core app.
        initializeCoreAppLogic(Appwrite);
    });
}


// --- 3. CORE APPLICATION LOGIC ---
// Function must accept the Appwrite object to use its methods (ID, Permission, Role)
function initializeCoreAppLogic(Appwrite) {
    // --- CONFIGURATION CONSTANTS ---
    const DATABASE_ID = '687a0e5a0031f474d1c7';
    const COLLECTION_ID = '687a0e65000b8a2d846c';
    const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-9239900240710331/2391487590';

    let heartRateChartInstance = null;
    
    // 1. INITIALIZE APPWRITE
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
        if (!window.AdMob) return;
        try {
            await AdMob.prepareInterstitial({
                adId: INTERSTITIAL_AD_UNIT_ID,
                isTesting: true,
            });
            console.log("Interstitial ad preloaded.");
        } catch (e) {
            console.warn('AdMob Preload Failed (expected if not on device):', e);
        }
    }


    // 4. AUTHENTICATION FUNCTIONS
    async function checkAuth() {
        try {
            const user = await account.get();
            showDashboard(user);
            handleAnalyzeData(); 
            handleGetTips();
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
            
            if (window.AdMob) {
                await AdMob.showInterstitial();
                preloadAdMobInterstitial(); 
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Login failed: " + error.message);
        }
    }

    async function handleSignup(e) {
        e.preventDefault();
        try {
            // Uses Appwrite.ID from the function scope
            await account.create(Appwrite.ID.unique(), elements.signupEmail.value, elements.signupPassword.value, elements.signupName.value);
            await account.createEmailPasswordSession(elements.signupEmail.value, elements.signupPassword.value);
            const currentUser = await account.get();
            showDashboard(currentUser);
            handleAnalyzeData(); 
            handleGetTips(); 
            alert("Account created and logged in!");

            if (window.AdMob) {
                const isAdReady = await AdMob.isInterstitialReady();
                if (isAdReady.ready) {
                    await AdMob.showInterstitial();
                } else {
                    await preloadAdMobInterstitial(); 
                    const isAdReadyAfterPrep = await AdMob.isInterstitialReady();
                    if (isAdReadyAfterPrep.ready) {
                        await AdMob.showInterstitial();
                    }
                }
                preloadAdMobInterstitial(); 
            }
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

            if (window.AdMob) {
                await AdMob.showInterstitial();
                preloadAdMobInterstitial(); 
            }
        } catch (error) {
            console.error("Logout error:", error);
            alert("Error logging out: " + error.message);
        }
    }

    // 5. HEALTH DATA FUNCTIONS
    async function handleHealthSubmit(e) {
        e.preventDefault();
        
        let user;
        try {
            user = await account.get(); 
        } catch (error) {
            console.error("Save data error: User session expired or invalid. Cannot retrieve user ID.");
            alert('Error saving data: Your session is invalid. Please log in again.');
            showAuth(); 
            return;
        }

        const heartRate = elements.heartRate.value;
        const bloodPressure = elements.bloodPressure.value;
        const bloodOxygen = elements.bloodOxygen.value;
        const weight = elements.weight.value;

        if (!heartRate && !bloodPressure && !bloodOxygen && !weight) {
            alert('Please enter at least one health metric to save.');
            return;
        }

        // Prepare data object with correct data types
        const data = {
            // FIX 2 (Mobile Insights Fix): Add the user ID to the document data for querying
            userId: user.$id 
        };
        if (heartRate) data.heartRate = parseInt(heartRate);
        if (bloodPressure) data.bloodPressure = bloodPressure;
        if (bloodOxygen) data.bloodOxygen = parseInt(bloodOxygen);
        if (weight) data.weight = parseFloat(weight); 
        data.timestamp = new Date().toISOString(); 

        try {
            await databases.createDocument(
                DATABASE_ID,  
                COLLECTION_ID,  
                // Uses Appwrite.ID from the function scope
                Appwrite.ID.unique(),    
                data,
                [ 
                    // Uses Appwrite.Permission and Appwrite.Role from the function scope
                    Appwrite.Permission.read(Appwrite.Role.user(user.$id)),
                    Appwrite.Permission.write(Appwrite.Role.user(user.$id))
                ]
            );
            alert('Health data saved successfully!');
            elements.healthForm.reset();
            // This now successfully loads data using the new 'userId' attribute
            handleAnalyzeData(); 
            handleGetTips(); 

            if (window.AdMob) {
                await AdMob.showInterstitial();
                preloadAdMobInterstitial(); 
            }
        } catch (error) {
            console.error("Save data error:", error);
            alert('Error saving data: ' + error.message);
        }
    }

    // --- REMAINDER OF APPLICATION LOGIC (UNCHANGED) ---

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

    async function handleAnalyzeData() {
        if (!elements.insightsContainer) return;

        try {
            const user = await account.get(); 
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID,
                [
                    // This query now relies on the 'userId' attribute saved in the document
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
                const latestBP = records[0].bloodPressure;
                const [systolic, diastolic] = latestBP ? latestBP.split('/').map(Number) : [null, null];

                // ... (rest of the tips logic is sound)
                const latestHR = records[0].heartRate;
                const latestBO = records[0].bloodOxygen;
                const latestWeight = records[0].weight;


                if (latestHR > 90) personalizedTips.push("Your recent heart rate is a bit high. Consider stress reduction techniques like deep breathing or meditation.");
                else if (latestHR < 60 && latestHR > 0) personalizedTips.push("Your heart rate seems low. If you're not an athlete, consult a doctor if you feel symptoms like dizziness.");
                if (latestBO < 95) personalizedTips.push("Your recent blood oxygen is on the lower side. Try some deep breathing exercises throughout the day.");
                if (systolic && diastolic && (systolic >= 130 || diastolic >= 80)) personalizedTips.push("Your recent blood pressure readings suggest you might be approaching or in the high range. Focus on a low-sodium diet and regular exercise.");
                else if (systolic && diastolic && (systolic < 90 || diastolic < 60)) personalizedTips.push("Your blood pressure appears low. Ensure you're well-hydrated and discuss with a doctor if you experience dizziness.");
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
            document.getElementById('signup-form').style.display = 'block';
        });
        if (elements.showLogin) elements.showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('signup-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        });
        if (elements.healthForm) elements.healthForm.addEventListener('submit', handleHealthSubmit);
        if (elements.tipsBtn) elements.tipsBtn.addEventListener('click', handleGetTips);
    }

    setupListeners();
    checkAuth(); 
}