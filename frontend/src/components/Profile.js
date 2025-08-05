import React from 'react';

function Profile() {
    const user = JSON.parse(localStorage.getItem('user'));

    return (
        <div>
            <h2>{user[1]}'s Profile</h2>
            <p>Email: {user[2]}</p>
            <p>Phone: {user[4]}</p>
            <p>Location: {user[5]}</p>
            <p>Interests: {user[6]}</p>
            <p>Type: {user[7]}</p>
            <p>Achievements: {user[8]}</p>
        </div>
    );
}

export default Profile;
