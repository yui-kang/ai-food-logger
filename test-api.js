async function testAPI() {
  try {
    console.log('Testing backend API...');
    const response = await fetch('https://ai-food-logger-1ka9.onrender.com/log/food', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw_text: 'I had a grilled chicken sandwich with avocado',
        mood_rating: 5
      })
    });
    
    const data = await response.json();
    console.log('✅ API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ API Error:', error.message);
  }
}

testAPI();