// Test login API endpoint with HTTP request
async function testLoginAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: '231fa04a02@gmail.com',
        password: '231fa04a02@gmail.com'
      })
    })
    
    const data = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', JSON.stringify(data, null, 2))
    
    if (response.ok) {
      console.log('✅ Login successful')
    } else {
      console.log('❌ Login failed')
    }
    
  } catch (error) {
    console.error('❌ Request error:', error)
  }
}

testLoginAPI()