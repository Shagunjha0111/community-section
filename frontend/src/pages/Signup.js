import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Signup() {
    const [form, setForm] = useState({});
    const navigate = useNavigate();

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    //Let there light
    const handleSignup = async () => {
        await fetch('http://localhost:5000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        navigate('/');
    };

    return (
        <div className="card" style={{ maxWidth: 520 }}>
            <h2 className="title">Signup</h2>
            <input name='name' placeholder='Name' onChange={handleChange} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
            <input name='email' placeholder='Email' onChange={handleChange} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
            <input name='password' placeholder='Password' onChange={handleChange} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
            <input name='phone' placeholder='Phone' onChange={handleChange} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
            <input name='location' placeholder='Location' onChange={handleChange} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
            <input name='interests' placeholder='Interest/Expertise' onChange={handleChange} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
            <input name='type' placeholder='Type (Student/Tutor)' onChange={handleChange} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
            <input name='achievements' placeholder='Achievements' onChange={handleChange} style={{ width: '100%', marginBottom: 8, padding: 8 }} />
            <div className="actions">
                <button className="btn primary" onClick={handleSignup}>Signup</button>
            </div>
        </div>
    );
}

export default Signup;