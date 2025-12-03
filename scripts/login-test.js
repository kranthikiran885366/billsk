const fetch = require('node-fetch');

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });

    const data = await response.json();
    console.log('Login response:', data);
    
    if (data.success) {
      console.log('Login successful!');
    } else {
      console.log('Login failed:', data.error?.message);
    }
  } catch (error) {
    console.error('Login error:', error);
  }
}

testLogin();