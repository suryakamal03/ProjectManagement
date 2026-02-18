import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} 
      />
      
      {/* Temporary Dashboard Route */}
      <Route 
        path="/dashboard" 
        element={
          isAuthenticated ? (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
                <p className="text-gray-400 mb-4">Coming soon...</p>
              </div>
            </div>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />

      {/* Default Route */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default App;
