import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Matchmaking() {
    const [users, setUsers] = useState([]);
    const [index, setIndex] = useState(0);
    const currentUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetch('http://localhost:5000/api/users')
            .then(res => res.json())
            .then(data => {
                const filtered = data.filter(u =>
                    u.email !== currentUser[2] &&
                    currentUser[6]?.split(',').some(interest =>
                        u.interests.includes(interest)
                    )
                );
                setUsers(filtered);
            });
    }, []);

    const handleConnect = async () => {
        try {
            await axios.post('http://localhost:5000/api/connections', {
                fromUserId: currentUser[0],
                toUserId: users[index].id
            });
            alert("Connection added!");
        } catch (err) {
            console.error("Error adding connection:", err);
            alert("Failed to add connection.");
        }
    };

    if (users.length === 0) return <p>No matches found</p>;

    const user = users[index];

    return (
        <div>
            <h3>{user.name}</h3>
            <p>Location: {user.location}</p>
            <p>Interests: {user.interests}</p>
            <p>Achievements: {user.achievements}</p>
            <button onClick={() => setIndex(Math.max(index - 1, 0))}>Previous</button>
            <button onClick={handleConnect}>Connect</button>
            <button onClick={() => setIndex(Math.min(index + 1, users.length - 1))}>Next</button>
        </div>
    );
}

export default Matchmaking;
