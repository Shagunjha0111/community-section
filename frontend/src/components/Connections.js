import React, { useEffect, useState } from 'react';

function Connections() {
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/connections')
      .then(res => res.json())
      .then(data => setConnections(data));
  }, []);

  return (
    <div>
      <h2>Connections</h2>
      {connections.map((conn, index) => (
        <div key={index}>
          User {conn.fromUserName} ➡ User {conn.toUserName}
        </div>
      ))}
    </div>
  );
}

export default Connections;
