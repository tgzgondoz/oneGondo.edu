import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let userData;
        
        // Mock user roles based on email
        if (email.includes('admin')) {
          userData = {
            id: 1,
            email: email,
            name: 'Admin User',
            role: 'admin',
            avatar: 'A'
          };
        } else {
          userData = {
            id: 2,
            email: email,
            name: 'John Student',
            role: 'student',
            avatar: 'JS'
          };
        }
        
        setUser(userData);
        setLoading(false);
        resolve(userData);
      }, 1500);
    });
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}