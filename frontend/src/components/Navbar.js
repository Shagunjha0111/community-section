

import React from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();

    return (
        <nav>
            <button onClick={() => navigate('/matchmaking')}>Matchmaking</button>
            <button onClick={() => navigate('/connections')}>Connections</button>
            <button onClick={() => navigate('/profile')}>Profile</button>
        </nav>
    );
}

export default Navbar;
