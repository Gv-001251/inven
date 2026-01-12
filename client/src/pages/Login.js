import React, { useState } from 'react';
import api from '../utils/axios'; // ✅ Import custom axios instance


function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🔑 LOGIN ATTEMPT:', { email, password });

    setError('');
    setLoading(true);

    try {
      // ✅ Use api instance instead of fetch
      const { data } = await api.post('/auth/login', { email, password });

      console.log('📦 Response data:', data);

      if (data.token) {
        console.log('✅ Login successful - saving to localStorage');

        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.employee));

        // ✅ Verify token was stored
        const storedToken = localStorage.getItem('token');
        console.log('🔐 Token stored successfully:', !!storedToken);
        console.log('👤 User data stored:', !!localStorage.getItem('user'));

        console.log('🔄 Navigating to /dashboard...');

        // Force reload to trigger AuthContext
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        console.log('❌ Login failed: No token received');
        setError(data.message || 'Login failed - no token received');
        setLoading(false);
      }
    } catch (err) {
      console.error('💥 Login error:', err);

      // ✅ Better error handling for axios
      if (err.response) {
        // Server responded with error
        console.error('Server error:', err.response.status, err.response.data);
        setError(err.response.data?.message || 'Invalid email or password');
      } else if (err.request) {
        // Request made but no response
        console.error('No response from server');
        setError('Network error - is server running on port 5000?');
      } else {
        // Something else happened
        console.error('Error:', err.message);
        setError('An unexpected error occurred');
      }

      setLoading(false);
    }
  };


  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ maxWidth: '400px', width: '100%', padding: '40px', background: 'white', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '24px', fontWeight: '600', color: '#1a1a1a' }}>Breeze Inventory</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px', fontSize: '14px' }}>Sign in to your account</p>

        {error && (
          <div style={{ padding: '12px', background: '#fee', color: '#c00', borderRadius: '5px', marginBottom: '20px', fontSize: '14px', border: '1px solid #fcc' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '15px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#9ca3af' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', background: '#f9f9f9', padding: '12px', borderRadius: '5px' }}>
          <strong style={{ display: 'block', marginBottom: '8px' }}>Demo Credentials:</strong>
          <div style={{ marginBottom: '4px' }}>
            <strong>Chairwoman (Full Access):</strong><br />
            chairwoman@breeze.com / chairwoman123
          </div>
          <div>
            <strong>Employee (Limited):</strong><br />
            employee@breeze.com / employee123
          </div>
        </div>
      </div>
    </div>
  );
}


export default Login;
