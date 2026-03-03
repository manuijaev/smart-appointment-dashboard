import { createContext, useContext, useMemo, useState } from 'react';
import api from '../services/api';
import { requestFcmToken } from '../services/firebase';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [fcmToken, setFcmToken] = useState(null);

  const registerDevice = async () => {
    try {
      const token = await requestFcmToken();
      if (!token) return null;
      await api.put('/staff/me/fcm-token/', { fcm_token: token });
      setFcmToken(token);
      return token;
    } catch (err) {
      console.error('FCM registration failed:', err?.message || err);
      return null;
    }
  };

  const value = useMemo(() => ({ fcmToken, registerDevice }), [fcmToken]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  return useContext(NotificationContext);
}
