// Initialize Appwrite
const client = new Appwrite.Client();
client
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('6878fa84002aa49b26a1'); // Your project ID

// DOM Elements
const healthForm = document.getElementById('health-form');
const analyzeBtn = document.getElementById('analyze-btn');
const tipsBtn = document.getElementById('tips-btn');
const metricSelect = document.getElementById('metric-select');
const insightsContainer = document.getElementById('insights-container');
const tipsContainer = document.getElementById('tips-container');

// Health Data Structure
let healthData = [];

// Initialize Chart
const ctx = document.getElementById('health-chart').getContext('2d');
const healthChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Heart Rate',
      data: [],
      borderColor: '#2e7d32',
      tension: 0.3,
      fill: false
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: false }
    }
  }
});

// Save health data to Appwrite
healthForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    heartRate: document.getElementById('heartRate').value,
    bloodPressure: document.getElementById('bloodPressure').value,
    bloodOxygen: document.getElementById('bloodOxygen').value,
    weight: document.getElementById('weight').value || null,
    temperature: document.getElementById('temperature').value || null,
    bloodSugar: document.getElementById('bloodSugar').value || null,
    notes: document.getElementById('notes').value || '',
    timestamp: new Date().toISOString()
  };

  try {
    const databases = new Appwrite.Databases(client);
    await databases.createDocument(
      'health_db',          // Database ID
      'health_records',     // Collection ID
      'unique()',           // Auto-generate document ID
      formData
    );
    
    alert('Health data saved successfully!');
    healthForm.reset();
    loadHealthData(); // Refresh data
  } catch (error) {
    console.error("Error saving data:", error);
    alert('Failed to save data. See console for details.');
  }
});

// Load and display health data
async function loadHealthData() {
  try {
    const databases = new Appwrite.Databases(client);
    const response = await databases.listDocuments(
      'health_db', 
      'health_records',
      [],
      20, // Limit to 20 records
      undefined,
      undefined,
      undefined,
      'timestamp' // Sort by timestamp
    );
    
    healthData = response.documents;
    updateChart();
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// Update the chart with selected metric
function updateChart() {
  if (healthData.length === 0) return;
  
  const selectedMetric = metricSelect.value;
  const labels = healthData.map(entry => 
    new Date(entry.timestamp).toLocaleDateString()
  );
  
  const data = healthData.map(entry => {
    if (selectedMetric === 'bloodPressure') {
      // Handle blood pressure (systolic/diastolic)
      return entry.bloodPressure ? parseInt(entry.bloodPressure.split('/')[0]) : null;
    }
    return entry[selectedMetric];
  });
  
  healthChart.data.labels = labels;
  healthChart.data.datasets[0].data = data;
  healthChart.data.datasets[0].label = 
    metricSelect.options[metricSelect.selectedIndex].text;
  
  healthChart.update();
}

// Metric selection change
metricSelect.addEventListener('change', updateChart);

// Generate health insights with Gemini API
analyzeBtn.addEventListener('click', async () => {
  if (healthData.length === 0) {
    insightsContainer.innerHTML = '<p>No data to analyze. Please record some health metrics first.</p>';
    return;
  }
  
  insightsContainer.innerHTML = '<p>Analyzing your health data... ⏳</p>';
  
  try {
    // Prepare health summary for AI
    const latestRecord = healthData[healthData.length - 1];
    const healthSummary = `
      Patient's latest health metrics:
      - Heart Rate: ${latestRecord.heartRate} bpm
      - Blood Pressure: ${latestRecord.bloodPressure} mmHg
      - Blood Oxygen: ${latestRecord.bloodOxygen}%
      ${latestRecord.weight ? `- Weight: ${latestRecord.weight} kg` : ''}
      ${latestRecord.temperature ? `- Temperature: ${latestRecord.temperature}°C` : ''}
      ${latestRecord.bloodSugar ? `- Blood Sugar: ${latestRecord.bloodSugar} mg/dL` : ''}
      ${latestRecord.notes ? `- Notes: ${latestRecord.notes}` : ''}
    `;
    
    const prompt = `As a medical AI assistant, analyze this patient data and provide 3-4 concise health insights with recommendations. Focus on potential risk factors and positive trends:\n\n${healthSummary}`;
    
    const insights = await getGeminiResponse(prompt);
    insightsContainer.innerHTML = `<div>${formatResponse(insights)}</div>`;
  } catch (error) {
    console.error("Analysis error:", error);
    insightsContainer.innerHTML = '<p>Failed to analyze data. Please try again.</p>';
  }
});

// Get personalized health tips
tipsBtn.addEventListener('click', async () => {
  tipsContainer.innerHTML = '<p>Generating personalized health tips... ⏳</p>';
  
  try {
    // Prepare context for tips
    const healthContext = healthData.length > 0 ? 
      `Based on your recent health metrics (avg heart rate: ${calculateAverage('heartRate')} bpm, latest blood pressure: ${healthData[healthData.length - 1].bloodPressure} mmHg).` : 
      "General health tips for maintaining wellness.";
    
    const prompt = `As a health coach, provide 5 personalized tips for improving cardiovascular health and overall wellness. ${healthContext} Make them actionable and specific.`;
    
    const tips = await getGeminiResponse(prompt);
    tipsContainer.innerHTML = `<div>${formatResponse(tips)}</div>`;
  } catch (error) {
    console.error("Tips error:", error);
    tipsContainer.innerHTML = '<p>Failed to generate tips. Please try again.</p>';
  }
});

// Helper function to calculate average
function calculateAverage(metric) {
  const values = healthData
    .map(entry => entry[metric])
    .filter(val => val !== null && val !== undefined);
  
  if (values.length === 0) return 'N/A';
  
  const sum = values.reduce((acc, val) => acc + parseFloat(val), 0);
  return (sum / values.length).toFixed(1);
}

// Gemini API integration
async function getGeminiResponse(prompt) {
  const API_KEY = "YOUR_GEMINI_API_KEY"; // Replace with your key
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      contents: [{ 
        parts: [{ text: prompt }] 
      }] 
    })
  });
  
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Format AI responses with line breaks
function formatResponse(text) {
  return text.split('\n').map(paragraph => 
    paragraph ? `<p>${paragraph}</p>` : ''
  ).join('');
}

// Initial data load
loadHealthData();

// Add to app.js
const account = new Appwrite.Account(client);

// Login function
async function login(email, password) {
  await account.createEmailSession(email, password);
}

// Signup function
async function signup(email, password, name) {
  await account.create(email, password, name);
  await login(email, password);
}