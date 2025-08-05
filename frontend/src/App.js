

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Matchmaking from './components/Matchmaking';
import Connections from './components/Connections';
import Profile from './components/Profile';

function App() {
    return (
        <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path='/matchmaking' element={<Matchmaking />} />
            <Route path='/connections' element={<Connections />} />
            <Route path='/profile' element={<Profile />} />
        </Routes>
    );
}

export default App;
