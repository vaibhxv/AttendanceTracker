import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AttendanceTracker from './components/AttendanceTracker';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar token={token} setToken={setToken} />
        <div className="container mx-auto px-4">
          <Routes>
            <Route
              path="/signup"
              element={!token ? <Register setToken={setToken} token={token} /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/login"
              element={!token ? <Login setToken={setToken}/> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/dashboard"
              element={token ? <AttendanceTracker/> : <Navigate to="/login" />}
            />
            <Route
              path="/"
              element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;