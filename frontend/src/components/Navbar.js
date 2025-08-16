

import React from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();

    return (
        <nav className="navbar">
            <div className="brand" onClick={() => navigate('/dashboard')}>Community</div>
            <div className="spacer" />
            <button className="navbtn" onClick={() => navigate('/matchmaking')}>Matchmaking</button>
            <button className="navbtn" onClick={() => navigate('/connections')}>Connections</button>
            <button className="navbtn" onClick={() => navigate('/profile')}>Profile</button>
        </nav>
    );
}

export default Navbar;
