import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Signup() {
    const [form, setForm] = useState({});
    const navigate = useNavigate();

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSignup = async () => {
        await fetch('http://localhost:5000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        navigate('/');
    };

    return (
        <div>
            <h2>Signup</h2>
            <input name='name' placeholder='Name' onChange={handleChange} />
            <input name='email' placeholder='Email' onChange={handleChange} />
            <input name='password' placeholder='Password' onChange={handleChange} />
            <input name='phone' placeholder='Phone' onChange={handleChange} />
            <input name='location' placeholder='Location' onChange={handleChange} />
            <input name='interests' placeholder='Interest/Expertise' onChange={handleChange} />
            <input name='type' placeholder='Type (Student/Tutor)' onChange={handleChange} />
            <input name='achievements' placeholder='Achievements' onChange={handleChange} />
            <button onClick={handleSignup}>Signup</button>
        </div>
    );
}

export default Signup;