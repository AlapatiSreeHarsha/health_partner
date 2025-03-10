import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-lg">
      <nav className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-gray-800">
              Health App
            </Link>
            
            <Link to="/sos" className="text-red-600 hover:text-red-700 font-semibold">
              SOS
            </Link>


            <Link
              to="/manage-appointments"
              className="text-gray-600 hover:text-gray-900"
            >
              Manage Appointments
            </Link>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;