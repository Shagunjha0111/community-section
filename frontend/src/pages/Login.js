import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        setError('');
        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({ message: 'Login failed' }));
                setError(data.message || 'Login failed');
                return;
            }
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/dashboard');
            } else {
                setError(data.message || 'Invalid credentials');
            }
        } catch (e) {
            setError('Unable to reach server at http://localhost:5000');
        }
    };

    return (
        <div className="card" style={{ maxWidth: 420 }}>
            <h2 className="title">Login</h2>
            <input placeholder='Email' onChange={e => setEmail(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
            <input type='password' placeholder='Password' onChange={e => setPassword(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
            {error && <div className="muted" style={{ color: '#b91c1c', marginBottom: 8 }}>{error}</div>}
            <div className="actions">
                <button className="btn primary" onClick={handleLogin}>Login</button>
            </div>
        </div>
    );
}

export default Login;