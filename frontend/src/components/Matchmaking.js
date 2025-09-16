import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Matchmaking.css';

function Matchmaking() {
    const [users, setUsers] = useState([]);
    const [index, setIndex] = useState(0);
    const [connections, setConnections] = useState([]);
    const [requests, setRequests] = useState([]);
    const [currentUser, setCurrentUser] = useState(() => {
        const stored = localStorage.getItem('user');
        if (!stored) return null;
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                const normalized = {
                    id: String(parsed[0]),
                    name: parsed[1],
                    email: parsed[2],
                    password: parsed[3],
                    phone: parsed[4],
                    location: parsed[5],
                    interests: parsed[6],
                    type: parsed[7],
                    achievements: parsed[8]
                };
                localStorage.setItem('user', JSON.stringify(normalized));
                return normalized;
            }
            return parsed;
        } catch (_) {
            return null;
        }
    });

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
                    if (!currentUser) return;
                    if (conn.fromUserId === String(currentUser.id) || conn.toUserId === String(currentUser.id)) {
                        if (conn.fromUserId === String(currentUser.id)) {
                            connectedUserIds.add(String(conn.toUserId));
                        } else {
                            connectedUserIds.add(String(conn.fromUserId));
                        }
                    }
                });

                // Add users with pending requests (both incoming and outgoing)
                requestsRes.forEach(req => {
                    if (req.type === 'outgoing' && req.status === 'pending') {
                        requestedUserIds.add(String(req.toUserId));
                    } else if (req.type === 'incoming' && req.status === 'pending') {
                        requestedUserIds.add(String(req.fromUserId));
                    }
                });

                // Filter users based on interests and exclude connected/requested users
                const filtered = usersRes.filter(u => {
                    // Normalize user fields
                    const candidateId = String(u.id || u.ID || u.Id || '').trim();
                    const candidateEmail = String(u.email || u.Email || '').trim();
                    const candidateInterests = String(u.interests || u['Interests/expertise'] || '').split(',').map(i => i.trim()).filter(Boolean);

                    // Exclude current user
                    if (currentUser && (candidateEmail && candidateEmail === String(currentUser.email)) ) return false;
                    if (currentUser && (candidateId && candidateId === String(currentUser.id)) ) return false;

                    // Exclude already connected users (by id)
                    if (candidateId && connectedUserIds.has(candidateId)) return false;

                    // Exclude users with pending requests (by id)
                    if (candidateId && requestedUserIds.has(candidateId)) return false;

                    // If no interests set for current user, don't block matching
                    const userInterests = String(currentUser?.interests || '').split(',').map(i => i.trim()).filter(Boolean);
                    if (userInterests.length === 0 || candidateInterests.length === 0) return true;

                    // Filter by interests (case-insensitive partial match)
                    return userInterests.some(interest => 
                        candidateInterests.some(profileInterest => 
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
            const target = users[index];
            const fromUserId = String(currentUser.id);
            const toUserId = String(target.id || target.ID || target.Id || target.name);
            await axios.post('http://localhost:5000/api/conn/send', {
                fromClient: clientId,
                toClient: otherClientId,
                fromUserId,
                toUserId
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
