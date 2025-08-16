import React, { useEffect, useState } from 'react';
import './Connections.css';

function Connections() {
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('incoming');
  const currentUser = JSON.parse(localStorage.getItem('user'));

  const clientId = window.location.port === '3001' ? '2' : '1';
  const otherClientId = clientId === '1' ? '2' : '1';

  const loadData = async () => {
    const [connRes, reqRes, usersRes] = await Promise.all([
      fetch('http://localhost:5000/api/connections').then(r => r.json()),
      fetch(`http://localhost:5000/api/conn?client=${clientId}`).then(r => r.json()),
      fetch('http://localhost:5000/api/users').then(r => r.json())
    ]);
    console.log('Connections data:', connRes); // Debug log
    setConnections(connRes);
    setRequests(reqRes);
    setUsers(usersRes);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acceptRequest = async (fromUserId, toUserId) => {
    await fetch('http://localhost:5000/api/conn/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderClient: otherClientId, receiverClient: clientId, fromUserId: String(fromUserId), toUserId: String(toUserId) })
    });
    loadData();
  };

  const removeConnection = async (fromUserId, toUserId, fromUserName, toUserName) => {
    if (window.confirm(`Are you sure you want to remove the connection with ${fromUserName === currentUser[1] ? toUserName : fromUserName}?`)) {
      try {
        const response = await fetch('http://localhost:5000/api/connections/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromUserId, toUserId, fromUserName, toUserName })
        });
        
        if (response.ok) {
          loadData();
        } else {
          const errorData = await response.json();
          alert(`Failed to remove connection: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error removing connection:', error);
        alert('Failed to remove connection');
      }
    }
  };

  const clearClient = async () => {
    await fetch(`http://localhost:5000/api/conn/clear?client=${clientId}`, { method: 'POST' });
    loadData();
  };

  const idToName = (id) => users.find(u => String(u.id) === String(id) || u.name === id)?.name || id;

  const outgoingPending = requests.filter(r => r.type === 'outgoing' && r.status === 'pending');
  const incomingPending = requests.filter(r => r.type === 'incoming' && r.status === 'pending');
  const confirmed = connections.filter(c => 
    c.fromUserName && c.toUserName && 
    c.fromUserName !== 'fromUserName' && c.toUserName !== 'toUserName'
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'incoming':
        return (
          <div className="tab-content">
            <h3>Incoming Requests</h3>
            {incomingPending.length === 0 ? (
              <div className="empty-state">
                <p>No pending incoming requests</p>
              </div>
            ) : (
              incomingPending.map((r, idx) => (
                <div className="request-card" key={idx}>
                  <div className="request-info">
                    <span className="request-name">{idToName(r.fromUserId)}</span>
                    <span className="request-status">wants to connect</span>
                  </div>
                  <button className="accept-btn" onClick={() => acceptRequest(r.fromUserId, r.toUserId)}>
                    Accept
                  </button>
                </div>
              ))
            )}
          </div>
        );
      
      case 'outgoing':
        return (
          <div className="tab-content">
            <h3>Outgoing Requests</h3>
            {outgoingPending.length === 0 ? (
              <div className="empty-state">
                <p>No pending outgoing requests</p>
              </div>
            ) : (
              outgoingPending.map((r, idx) => (
                <div className="request-card pending" key={idx}>
                  <div className="request-info">
                    <span className="request-name">{idToName(r.toUserId)}</span>
                    <span className="request-status">Request sent</span>
                  </div>
                  <span className="pending-badge">Pending</span>
                </div>
              ))
            )}
          </div>
        );
      
      case 'accepted':
        return (
          <div className="tab-content">
            <h3>Accepted Connections</h3>
            {confirmed.length === 0 ? (
              <div className="empty-state">
                <p>No connections yet</p>
              </div>
            ) : (
              confirmed.map((conn, index) => (
                <div className="connection-card" key={index}>
                  <div className="connection-info">
                    <span className="connection-from">{conn.fromUserName}</span>
                    <span className="connection-arrow">➜</span>
                    <span className="connection-to">{conn.toUserName}</span>
                  </div>
                  <div className="connection-actions">
                    <span className="connection-status">Connected</span>
                    <button 
                      className="remove-btn" 
                      onClick={() => removeConnection(conn.fromUserId, conn.toUserId, conn.fromUserName, conn.toUserName)}
                      title="Remove connection"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="connections-container">
      <div className="connections-header">
        <h2>Connections</h2>
        <button className="clear-btn" onClick={clearClient}>
          Clear Requests
        </button>
      </div>

      <div className="sub-navbar">
        <button 
          className={`tab-btn ${activeTab === 'incoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('incoming')}
        >
          Incoming ({incomingPending.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'outgoing' ? 'active' : ''}`}
          onClick={() => setActiveTab('outgoing')}
        >
          Outgoing ({outgoingPending.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'accepted' ? 'active' : ''}`}
          onClick={() => setActiveTab('accepted')}
        >
          Accepted ({confirmed.length})
        </button>
      </div>

      <div className="connections-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default Connections;
