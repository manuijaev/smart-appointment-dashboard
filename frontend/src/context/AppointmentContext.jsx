import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import api from '../services/api';

const AppointmentContext = createContext(null);

export function AppointmentProvider({ children }) {
  const [appointments, setAppointments] = useState([]);

  const loadMyAppointments = useCallback(async () => {
    const { data } = await api.get('/appointments/my/');
    setAppointments(data);
  }, []);

  const createAppointment = useCallback(async (payload) => {
    await api.post('/appointments/create/', payload);
  }, []);

  const updateAppointment = useCallback(async (id, payload) => {
    await api.patch(`/appointments/update/${id}/`, payload);
    await loadMyAppointments();
  }, [loadMyAppointments]);

  const deleteAppointment = useCallback(async (id) => {
    await api.delete(`/appointments/delete/${id}/`);
    await loadMyAppointments();
  }, [loadMyAppointments]);

  const deleteAppointmentsBulk = useCallback(async (ids) => {
    await Promise.all(ids.map((id) => api.delete(`/appointments/delete/${id}/`)));
    await loadMyAppointments();
  }, [loadMyAppointments]);

  const value = useMemo(
    () => ({
      appointments,
      loadMyAppointments,
      createAppointment,
      updateAppointment,
      deleteAppointment,
      deleteAppointmentsBulk,
    }),
    [appointments]
  );

  return <AppointmentContext.Provider value={value}>{children}</AppointmentContext.Provider>;
}

export function useAppointments() {
  return useContext(AppointmentContext);
}
