import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../context/AppointmentContext';
import { useNotification } from '../context/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';
import { sendVisitorResponseEmail } from '../services/emailjs';

const RESPONSE_LOOP_STORAGE_KEY = 'staff_response_loop_enabled_ids';

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { registerDevice, subscribeToForegroundMessages } = useNotification();
  const { appointments, loadMyAppointments, updateAppointment, deleteAppointment, deleteAppointmentsBulk } = useAppointments();
  const [responseNote, setResponseNote] = useState({});
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [toast, setToast] = useState('');
  const [isSendingResponse, setIsSendingResponse] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);
  const [responseLoopEnabledIds, setResponseLoopEnabledIds] = useState([]);
  const [responseLoopPhase, setResponseLoopPhase] = useState('visual');
  const longPressTimerRef = useRef(null);

  useEffect(() => {
    loadMyAppointments().catch(() => {
      setError('Session expired. Please log in again.');
    });
  }, []);

  useEffect(() => {
    registerDevice().catch(() => {});
  }, [registerDevice]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadMyAppointments().catch(() => {});
    }, 8000);
    return () => clearInterval(intervalId);
  }, [loadMyAppointments]);

  useEffect(() => {
    let unsubscribe = () => {};
    subscribeToForegroundMessages((payload) => {
      const title = payload?.notification?.title || 'New update';
      const body = payload?.notification?.body || 'A new appointment update is available.';
      setToast(`${title}: ${body}`);
      setTimeout(() => setToast(''), 4000);
      loadMyAppointments().catch(() => {});
    }).then((unsub) => {
      if (typeof unsub === 'function') unsubscribe = unsub;
    }).catch(() => {});
    return () => unsubscribe();
  }, [subscribeToForegroundMessages, loadMyAppointments]);

  useEffect(() => {
    document.body.classList.add('dashboard-background');
    return () => {
      document.body.classList.remove('dashboard-background');
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(RESPONSE_LOOP_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setResponseLoopEnabledIds(parsed);
      }
    } catch {
      localStorage.removeItem(RESPONSE_LOOP_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(RESPONSE_LOOP_STORAGE_KEY, JSON.stringify(responseLoopEnabledIds));
  }, [responseLoopEnabledIds]);

  useEffect(() => {
    if (!responseLoopEnabledIds.length) return;
    const intervalId = setInterval(() => {
      setResponseLoopPhase((prev) => (prev === 'visual' ? 'response' : 'visual'));
    }, 5000);
    return () => clearInterval(intervalId);
  }, [responseLoopEnabledIds.length]);

  const updateStatus = async (appointmentId, status) => {
    const appointment = appointments.find((item) => item.id === appointmentId);
    const note = responseNote[appointmentId] || '';

    await updateAppointment(appointmentId, {
      status,
      response_note: note,
    });

    if (appointment) {
      const emailResult = await sendVisitorResponseEmail({
        visitor_name: appointment.visitor_name,
        visitor_email: appointment.visitor_email,
        status,
        response_note: note,
        appointment_date: appointment.appointment_date,
        staff_name: appointment.staff_name || 'Staff',
        staff_email: appointment.staff_email || '',
      });
      if (!emailResult?.sent) {
        setNotice(`Status updated, but email was not sent: ${emailResult?.error || 'EmailJS error'}`);
        setToast(`Response submitted to ${appointment.visitor_name}.`);
      } else {
        setNotice('Status updated and visitor email sent.');
        setToast(`Response submitted to ${appointment.visitor_name}.`);
      }
    }
  };

  const requestStatusUpdate = (appointmentId, visitorName, status) => {
    setPendingStatusUpdate({ appointmentId, visitorName, status });
  };

  const confirmStatusUpdate = async () => {
    if (!pendingStatusUpdate) return;
    const { appointmentId, status } = pendingStatusUpdate;
    setError('');
    setNotice('');
    setIsSendingResponse(true);
    try {
      await updateStatus(appointmentId, status);
      setTimeout(() => {
        setPendingStatusUpdate(null);
      }, 220);
      setTimeout(() => setToast(''), 2500);
    } catch (err) {
      const message =
        err?.response?.data?.response_note?.[0] ||
        err?.response?.data?.detail ||
        'Unable to update appointment or send email.';
      setError(message);
      setPendingStatusUpdate(null);
    } finally {
      setIsSendingResponse(false);
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const requestDeleteSelected = () => {
    if (!selectedIds.length) return;
    setPendingDelete({ type: 'bulk', ids: selectedIds });
  };

  const requestDeleteSingle = (id) => {
    setPendingDelete({ type: 'single', ids: [id] });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'single') {
      await deleteAppointment(pendingDelete.ids[0]);
    } else {
      await deleteAppointmentsBulk(pendingDelete.ids);
    }
    setSelectedIds([]);
    setSelectionMode(false);
    setPendingDelete(null);
    setPreviewItem(null);
    setNotice('Appointment(s) deleted successfully.');
  };

  const handleCardTouchStart = (item) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setSelectionMode(true);
      setPreviewItem(item);
    }, 2000);
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleLogout = () => {
    sessionStorage.setItem('app_toast', 'Logged out successfully.');
    logout();
    navigate('/staff/login');
  };

  const toggleResponseLoop = (appointmentId) => {
    setResponseLoopEnabledIds((prev) => {
      if (prev.includes(appointmentId)) {
        return prev.filter((id) => id !== appointmentId);
      }
      setResponseLoopPhase('response');
      return [...prev, appointmentId];
    });
  };

  return (
    <div className="container">
      <div className="header-row">
        <h1>{user?.full_name} Dashboard</h1>
        <button className="logout-icon-btn" onClick={handleLogout} aria-label="Logout" title="Logout">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-8" />
            <path d="M14 12H3" />
            <path d="m7 8-4 4 4 4" />
          </svg>
        </button>
      </div>
      <p className="page-subtitle">Review requests and send immediate responses to visitors.</p>
      <div className="selection-toolbar">
        <button
          type="button"
          className="btn-muted toolbar-btn"
          onClick={() => {
            setSelectionMode((prev) => !prev);
            if (selectionMode) setSelectedIds([]);
          }}
        >
          {selectionMode ? 'Done' : 'Select'}
        </button>
        {selectionMode && (
          <>
            <span className="selection-count">{selectedIds.length} selected</span>
            <button
              type="button"
              className="btn-danger toolbar-btn"
              disabled={!selectedIds.length}
              onClick={requestDeleteSelected}
            >
              Delete Selected
            </button>
          </>
        )}
      </div>
      <div className="list">
        {error && <p className="error">{error}</p>}
        {notice && <p className="success">{notice}</p>}
        <div className="appointment-grid">
          {appointments.map((item) => (
            <article
              className={`card appointment-card ${selectionMode && selectedIds.includes(item.id) ? 'is-selected' : ''}`}
              key={item.id}
              onTouchStart={() => handleCardTouchStart(item)}
              onTouchEnd={clearLongPress}
              onTouchMove={clearLongPress}
            >
              {selectionMode && (
                <label className="select-chip">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelected(item.id)}
                  />
                  <span>Select</span>
                </label>
              )}
              <div className="appointment-head">
                <h3>{item.visitor_name}</h3>
                <span className={`status-badge status-${String(item.status || '').toLowerCase()}`}>{item.status}</span>
              </div>
              <p className="appointment-meta">{item.visitor_email}</p>
              <p className="appointment-meta">{new Date(item.appointment_date).toLocaleString()}</p>
              <div className="visitor-message">
                <p className="visitor-message-label">Visitor Message</p>
                <p className="visitor-message-text">{item.message || 'No message provided.'}</p>
              </div>
              {!selectionMode ? (
                <>
                  {item.status === 'Pending' ? (
                    <>
                      <textarea
                        placeholder="Response note"
                        value={responseNote[item.id] || ''}
                        onChange={(e) => setResponseNote((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      />
                      <div className="row-actions compact-actions">
                        <button onClick={() => requestStatusUpdate(item.id, item.visitor_name, 'Accepted')}>Accept</button>
                        <button onClick={() => requestStatusUpdate(item.id, item.visitor_name, 'Rescheduled')}>Reschedule</button>
                        <button className="btn-danger" onClick={() => requestStatusUpdate(item.id, item.visitor_name, 'Declined')}>Decline</button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="response-toggle-btn"
                      onClick={() => toggleResponseLoop(item.id)}
                    >
                      <div
                        className={`response-state ${
                          responseLoopEnabledIds.includes(item.id) && responseLoopPhase === 'response'
                            ? 'show-response'
                            : 'show-visual'
                        }`}
                      >
                        <div className="response-submitted response-layer">
                          <span className="response-submitted-icon" aria-hidden="true">✓</span>
                          <p className="response-submitted-text">
                            Response sent successfully to <strong>{item.visitor_name}</strong> email
                          </p>
                        </div>
                        <div className="response-details response-layer">
                          <p className="response-details-label">Sent Response</p>
                          <p className="response-details-text">{item.response_note || 'No response note.'}</p>
                        </div>
                      </div>
                    </button>
                  )}
                </>
              ) : (
                <button className="btn-danger compact-single-delete" onClick={() => requestDeleteSingle(item.id)}>
                  Delete Card
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
      <ConfirmModal
        isOpen={Boolean(pendingStatusUpdate)}
        title={`Confirm ${pendingStatusUpdate?.status || ''}`}
        message={
          pendingStatusUpdate
            ? `Update ${pendingStatusUpdate.visitorName}'s appointment to "${pendingStatusUpdate.status}"?`
            : ''
        }
        confirmText="Yes, Update"
        loadingText="Sending"
        tone={pendingStatusUpdate?.status === 'Declined' ? 'danger' : 'default'}
        isLoading={isSendingResponse}
        onConfirm={confirmStatusUpdate}
        onCancel={() => {
          if (isSendingResponse) return;
          setPendingStatusUpdate(null);
        }}
      />
      {toast && <div className="toast toast-success">{toast}</div>}
      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        title="Delete Appointment(s)?"
        message={
          pendingDelete?.type === 'single'
            ? 'Delete this appointment card from your dashboard?'
            : `Delete ${pendingDelete?.ids?.length || 0} selected appointment cards from your dashboard?`
        }
        confirmText="Delete"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
      {previewItem && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Appointment preview">
          <div className="modal-card preview-card">
            <h3>{previewItem.visitor_name}</h3>
            <p>{previewItem.visitor_email}</p>
            <p>{new Date(previewItem.appointment_date).toLocaleString()}</p>
            <p>{previewItem.message || 'No visitor message.'}</p>
            <div className="modal-actions">
              <button type="button" className="btn-muted" onClick={() => setPreviewItem(null)}>
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleSelected(previewItem.id);
                  setPreviewItem(null);
                }}
              >
                {selectedIds.includes(previewItem.id) ? 'Unselect' : 'Select'}
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  setPreviewItem(null);
                  requestDeleteSingle(previewItem.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
