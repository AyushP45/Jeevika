import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jeevika_token');
    const savedUser = localStorage.getItem('jeevika_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      authAPI.getMe().then(res => {
        setUser(res.data);
        localStorage.setItem('jeevika_user', JSON.stringify(res.data));
      }).catch(() => {
        localStorage.removeItem('jeevika_token');
        localStorage.removeItem('jeevika_user');
        setUser(null);
      });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('jeevika_token', res.data.token);
    localStorage.setItem('jeevika_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    localStorage.setItem('jeevika_token', res.data.token);
    localStorage.setItem('jeevika_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('jeevika_token');
    localStorage.removeItem('jeevika_user');
    setUser(null);
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('jeevika_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
