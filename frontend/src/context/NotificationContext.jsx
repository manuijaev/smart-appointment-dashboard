import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { listenForForegroundMessages, requestFcmToken } from '../services/firebase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState(null);

  const registerDevice = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const tokenKey = 'fcm_token_last_user_id';
    if (!user?.id) return;
    const lastUser = localStorage.getItem(tokenKey);
    if (lastUser === String(user.id) && fcmToken) return;

    registerDevice()
      .then((token) => {
        if (token) {
          localStorage.setItem(tokenKey, String(user.id));
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const subscribeToForegroundMessages = useCallback(
    async (onNotification) => listenForForegroundMessages(onNotification),
    []
  );

  const value = useMemo(
    () => ({ fcmToken, registerDevice, subscribeToForegroundMessages }),
    [fcmToken, registerDevice, subscribeToForegroundMessages]
  );
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  return useContext(NotificationContext);
}
