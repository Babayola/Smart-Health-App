const client = new Appwrite.Client();
client
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('6878fa84002aa49b26a1'); // Your project ID

// Save health data to Appwrite
document.getElementById('save-btn').addEventListener('click', async () => {
  const databases = new Appwrite.Databases(client);
  try {
    await databases.createDocument(
      'health_db',          // Database ID
      'health_records',     // Collection ID
      'unique()',           // Auto-generate document ID
      {
        heartRate: document.getElementById('heartRate').value,
        bloodPressure: document.getElementById('bloodPressure').value,
        timestamp: new Date().toISOString()
      }
    );
    alert('Data saved successfully!');
  } catch (error) {
    console.error("Error:", error);
    alert('Failed to save data.');
  }
});

// Fetch and display existing data
async function loadData() {
  const databases = new Appwrite.Databases(client);
  const data = await databases.listDocuments('health_db', 'health_records');
  document.getElementById('data-container').innerHTML = 
    JSON.stringify(data.documents, null, 2);
}
loadData();

// Gemini AI Integration
async function getHealthTips() {
  const prompt = "Generate 3 bullet points for heart health tips:";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyCFqctpgeJIV7hqTP-BDKyrvb73ueTkGpU`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Add a button to call this (add to HTML)
document.getElementById('ai-btn').addEventListener('click', async () => {
  const tips = await getHealthTips();
  document.getElementById('data-container').textContent = tips;
});