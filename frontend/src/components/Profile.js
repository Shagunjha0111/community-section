import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

function Profile() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <h2 className="profile-title">{user[1]}'s Profile</h2>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
                <div className="profile-content">
                    <div className="profile-field">
                        <span className="field-label">Email:</span>
                        <span className="field-value">{user[2]}</span>
                    </div>
                    <div className="profile-field">
                        <span className="field-label">Phone:</span>
                        <span className="field-value">{user[4] || 'Not provided'}</span>
                    </div>
                    <div className="profile-field">
                        <span className="field-label">Location:</span>
                        <span className="field-value">{user[5] || 'Not provided'}</span>
                    </div>
                    <div className="profile-field">
                        <span className="field-label">Interests:</span>
                        <span className="field-value">{user[6] || 'Not specified'}</span>
                    </div>
                    <div className="profile-field">
                        <span className="field-label">Type:</span>
                        <span className="field-value">{user[7] || 'Not specified'}</span>
                    </div>
                    <div className="profile-field">
                        <span className="field-label">Achievements:</span>
                        <span className="field-value">{user[8] || 'None listed'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
