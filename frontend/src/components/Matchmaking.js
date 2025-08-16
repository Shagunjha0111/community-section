import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Matchmaking.css';

function Matchmaking() {
    const [users, setUsers] = useState([]);
    const [index, setIndex] = useState(0);
    const [connections, setConnections] = useState([]);
    const [requests, setRequests] = useState([]);
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const clientId = window.location.port === '3001' ? '2' : '1';
    const otherClientId = clientId === '1' ? '2' : '1';

    useEffect(() => {
        const loadData = async () => {
            try {
                const [usersRes, connectionsRes, requestsRes] = await Promise.all([
                    fetch('http://localhost:5000/api/users').then(res => res.json()),
                    fetch('http://localhost:5000/api/connections').then(res => res.json()),
                    fetch(`http://localhost:5000/api/conn?client=${clientId}`).then(res => res.json())
                ]);

                // Get all connected and requested user IDs
                const connectedUserIds = new Set();
                const requestedUserIds = new Set();

                // Add connected users
                connectionsRes.forEach(conn => {
                    if (conn.fromUserName === currentUser[1] || conn.toUserName === currentUser[1]) {
                        if (conn.fromUserName === currentUser[1]) {
                            connectedUserIds.add(conn.toUserName);
                        } else {
                            connectedUserIds.add(conn.fromUserName);
                        }
                    }
                });

                // Add users with pending requests (both incoming and outgoing)
                requestsRes.forEach(req => {
                    if (req.type === 'outgoing' && req.status === 'pending') {
                        requestedUserIds.add(req.toUserId);
                    } else if (req.type === 'incoming' && req.status === 'pending') {
                        requestedUserIds.add(req.fromUserId);
                    }
                });

                // Filter users based on interests and exclude connected/requested users
                const filtered = usersRes.filter(u => {
                    // Exclude current user
                    if (u.email === currentUser[2]) return false;
                    
                    // Exclude already connected users
                    if (connectedUserIds.has(u.name)) return false;
                    
                    // Exclude users with pending requests
                    if (requestedUserIds.has(u.name) || requestedUserIds.has(u.id)) return false;
                    
                    // Filter by interests
                    const userInterests = currentUser[6]?.split(',').map(i => i.trim()) || [];
                    const profileInterests = (u.interests || '').split(',').map(i => i.trim());
                    
                    return userInterests.some(interest => 
                        profileInterests.some(profileInterest => 
                            profileInterest.toLowerCase().includes(interest.toLowerCase()) ||
                            interest.toLowerCase().includes(profileInterest.toLowerCase())
                        )
                    );
                });

                setUsers(filtered);
                setConnections(connectionsRes);
                setRequests(requestsRes);
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleConnect = async () => {
        try {
            await axios.post('http://localhost:5000/api/conn/send', {
                fromClient: clientId,
                toClient: otherClientId,
                fromUserId: String(currentUser[1] || currentUser[0]),
                toUserId: String(users[index].name || users[index].id)
            });
            alert('Request sent');
            
            // Remove the user from the list after sending request
            const updatedUsers = users.filter((_, i) => i !== index);
            setUsers(updatedUsers);
            if (index >= updatedUsers.length && updatedUsers.length > 0) {
                setIndex(updatedUsers.length - 1);
            }
        } catch (err) {
            console.error('Error sending request:', err);
            alert('Failed to send request.');
        }
    };

    if (users.length === 0) {
        return (
            <div className="matchmaking-container">
                <div className="matchmaking-card empty-state">
                    <div className="empty-icon">💫</div>
                    <h3 className="empty-title">No More Matches</h3>
                    <p className="empty-message">
                        You've either connected with all available users or sent requests to them.
                    </p>
                    <p className="empty-submessage">
                        Check your connections tab to see your pending requests and accepted connections.
                    </p>
                </div>
            </div>
        );
    }

    const user = users[index];

    return (
        <div className="matchmaking-container">
            <div className="matchmaking-card">
                <div className="user-header">
                    <div className="user-avatar">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="user-info">
                        <h3 className="user-name">{user.id}</h3>
                        <span className="user-location">
                            📍 {user.location || 'Location not specified'}
                        </span>
                    </div>
                </div>

                <div className="user-details">
                    <div className="detail-field">
                        <span className="field-label">Interests</span>
                        <span className="field-value">{user['Interests/expertise'] || 'Not specified'}</span>
                    </div>
                    <div className="detail-field">
                        <span className="field-label">Achievements</span>
                        <span className="field-value">{user.achievements || 'None listed'}</span>
                    </div>
                </div>

                <div className="matchmaking-actions">
                    <button 
                        className="nav-btn prev-btn" 
                        onClick={() => setIndex(Math.max(index - 1, 0))}
                        disabled={index === 0}
                    >
                        ← Previous
                    </button>
                    <button className="connect-btn" onClick={handleConnect}>
                        Connect
                    </button>
                    <button 
                        className="nav-btn next-btn" 
                        onClick={() => setIndex(Math.min(index + 1, users.length - 1))}
                        disabled={index === users.length - 1}
                    >
                        Next →
                    </button>
                </div>

                {/* <div className="match-info">
                    <div className="match-counter">
                        <span className="counter-text">
                            {index + 1} of {users.length} available matches
                        </span>
                    </div>
                    <div className="match-progress">
                        <div 
                            className="progress-bar" 
                            style={{ width: `${((index + 1) / users.length) * 100}%` }}
                        ></div>
                    </div>
                </div> */}
            </div>
        </div>
    );
}

export default Matchmaking;
