import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../context/AppointmentContext';
import { useNotification } from '../context/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';
import { sendVisitorResponseEmail } from '../services/emailjs';
import api from '../services/api';

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  filter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15,18 9,12 15,6" />
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
    </svg>
  ),
  alertCircle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23,4 23,10 17,10" />
      <polyline points="1,20 1,14 7,14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
};

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { appointments, loadMyAppointments, updateAppointment, deleteAppointment, deleteAppointmentsBulk } = useAppointments();
  const { subscribeToForegroundMessages } = useNotification();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [responseNote, setResponseNote] = useState({});
  const [responseAreaOpen, setResponseAreaOpen] = useState({});
  const [responseAction, setResponseAction] = useState({});
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [toast, setToast] = useState('');
  const [isSendingResponse, setIsSendingResponse] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isCurrentlyAvailable, setIsCurrentlyAvailable] = useState(user?.is_available ?? true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [overdueDismissedKey, setOverdueDismissedKey] = useState('');
  // Initialize notifications from localStorage for persistence
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('staff_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Current time for clock display
  const [currentTime, setCurrentTime] = useState(new Date());

  // Persist notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('staff_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications:', e);
    }
  }, [notifications]);

  // Subscribe to foreground push notifications
  useEffect(() => {
    let unsubscribe = null;
    
    const setupSubscription = async () => {
      unsubscribe = await subscribeToForegroundMessages((payload) => {
        // Handle incoming push notification
        const { notification, data } = payload;
        const title = notification?.title || 'Visitor waiting';
        const body = notification?.body || 'You have a visitor waiting for you';
        
        // Create notification object
        const newNotification = {
          id: Date.now(),
          message: body,
          type: 'appointment',
          read: false,
          timestamp: new Date().toISOString(),
          data: data
        };
        
        // Add to notifications list
        setNotifications(prev => [newNotification, ...prev].slice(0, 50));
        
        // Show toast notification
        setToast(body);
        setTimeout(() => setToast(''), 5000);
      });
    };
    
    if (subscribeToForegroundMessages) {
      setupSubscription();
    }
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [subscribeToForegroundMessages]);
  
  const longPressTimerRef = useRef(null);
  const notificationRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    document.body.classList.remove('home-background', 'auth-background', 'dashboard-background');
    document.body.classList.add('home-background');
    return () => {
      document.body.classList.remove('home-background');
    };
  }, []);

  useEffect(() => {
    loadMyAppointments().catch(() => {
      setError('Session expired. Please log in again.');
    });
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadMyAppointments().catch(() => {});
    }, 15000);
    return () => clearInterval(intervalId);
  }, [loadMyAppointments]);

// Update time every second for clock display
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatSentTime = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getDateLabel = () => {
    const date = new Date();
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getTimeLabel = () => {
    return currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' EAT';
  };

  const getWeekNumber = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 604800000;
    return Math.ceil(diff / oneWeek);
  };

  const getRelativeTimeLabel = (timestamp) => {
    if (!timestamp) return 'just now';
    const createdTime = new Date(timestamp).getTime();
    if (Number.isNaN(createdTime)) return 'just now';
    const diffSeconds = Math.max(Math.round((Date.now() - createdTime) / 1000), 0);
    if (diffSeconds < 10) return 'just now';
    const units = [
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
    ];

    for (const unit of units) {
      if (diffSeconds >= unit.seconds) {
        const value = Math.floor(diffSeconds / unit.seconds);
        return `${value} ${unit.label}${value > 1 ? 's' : ''} ago`;
      }
    }

    return `${diffSeconds} second${diffSeconds === 1 ? '' : 's'} ago`;
  };

  const filteredAppointments = appointments.filter(a => {
    // Filter by status for specific tabs
    if (activeTab === 'pending' && a.status !== 'Pending') return false;
    if (activeTab === 'accepted' && a.status !== 'Accepted') return false;
    if (activeTab === 'declined' && a.status !== 'Declined') return false;
    if (activeTab === 'history' && ['Pending', 'Accepted'].includes(a.status)) return false;
    
    if (dateFilter === 'today' && !a.appointment_date.startsWith(today)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        a.visitor_name?.toLowerCase().includes(query) ||
        a.visitor_email?.toLowerCase().includes(query) ||
        a.service?.name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    pending: appointments.filter(a => a.status === 'Pending').length,
    accepted: appointments.filter(a => a.status === 'Accepted').length,
    declined: appointments.filter(a => a.status === 'Declined').length,
    rescheduled: appointments.filter(a => a.status === 'Rescheduled').length,
    today: appointments.filter(a => a.appointment_date.startsWith(today)).length,
    total: appointments.length,
    acceptRate: appointments.length > 0 
      ? Math.round((appointments.filter(a => a.status === 'Accepted').length / appointments.length) * 100) 
      : 0,
  };

  const overdueAppointments = appointments
    .filter(a => a.status === 'Pending')
    .filter((a) => {
      const created = new Date(a.created_at || a.appointment_date);
      const createdMs = created.getTime();
      if (Number.isNaN(createdMs)) return false;
      return Date.now() - createdMs >= 30 * 60 * 1000;
    })
    .sort((a, b) => {
      const aTime = new Date(a.created_at || a.appointment_date).getTime();
      const bTime = new Date(b.created_at || b.appointment_date).getTime();
      return aTime - bTime;
    });

  const overdueListKey = overdueAppointments.map((apt) => apt.id).join(',');
  const showOverdueAnnouncement = overdueAppointments.length > 0 && overdueListKey && overdueListKey !== overdueDismissedKey;
  const handleOverdueAnnouncementClick = () => {
    if (!overdueAppointments.length) return;
    openPreview(overdueAppointments[0]);
    setOverdueDismissedKey(overdueListKey);
  };
  const handleOverdueAnnouncementKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOverdueAnnouncementClick();
    }
  };

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
      const toastMessage =
        status === 'Accepted'
          ? "Visitor notified — they've been paged"
          : `Response submitted to ${appointment.visitor_name}.`;
      if (!emailResult?.sent) {
        setNotice(`Status updated, but email was not sent: ${emailResult?.error || 'EmailJS error'}`);
        setToast(toastMessage);
      } else {
        setNotice('Status updated and visitor email sent.');
        setToast(toastMessage);
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

  const handleLogout = () => {
    sessionStorage.setItem('app_toast', `Goodbye, ${user?.full_name || 'Staff'}! You have been logged out successfully.`);
    logout();
    navigate('/staff/login');
  };

  const openResponseArea = (id, action = 'Accepted') => {
    setResponseAction((prev) => ({ ...prev, [id]: action }));
    setResponseAreaOpen((prev) => ({ ...prev, [id]: true }));
  };

  const closeResponseArea = (id) => {
    setResponseAreaOpen((prev) => ({ ...prev, [id]: false }));
  };

  const openPreview = (item) => {
    setPreviewItem(item);
  };

  const closePreview = () => {
    setPreviewItem(null);
  };

  const showToast = (msg) => {
    setToast(msg);
    // Add to notifications
    const newNotification = {
      id: Date.now(),
      message: msg,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 20));
    setTimeout(() => setToast(''), 4000);
  };

  const handleAvailabilityToggle = async () => {
    if (availabilityLoading) return;
    const nextState = !isCurrentlyAvailable;
    setAvailabilityLoading(true);
    try {
      const { data } = await api.patch('/staff/me/availability/', { is_available: nextState });
      const updatedUser = data?.user || {};
      updateUser(updatedUser);
      setIsCurrentlyAvailable(updatedUser.is_available ?? nextState);
      showToast(
        nextState
          ? 'You are now available for visitors.'
          : 'Visitors will see you as unavailable until you toggle back.'
      );
    } catch (err) {
      showToast(
        err?.response?.data?.detail ||
        'Failed to update availability. Try again in a moment.'
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleExportCSV = () => {
    const data = filteredAppointments.length > 0 ? filteredAppointments : appointments;
    if (data.length === 0) {
      showToast('No visit requests to export');
      return;
    }
    
    const headers = ['ID', 'Visitor Name', 'Visitor Email', 'Date/Time Sent', 'Date/Time', 'Status', 'Visitor Message', 'Staff Response'];
    const csvContent = [
      headers.join(','),
      ...data.map(apt => [
        apt.id,
        `"${apt.visitor_name}"`,
        `"${apt.visitor_email}"`,
        `"${apt.appointment_date ? new Date(apt.appointment_date).toLocaleString('en-GB') : ''}"`,
        apt.date && apt.time ? `"${apt.date} ${apt.time}"` : '""',
        apt.status,
        `"${apt.message || ''}"`,
        `"${apt.response_note || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `visit_requests_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Visit requests exported to CSV');
  };

  const handleExportStats = () => {
    const statsData = [
      { Metric: 'Total visit requests', Value: appointments.length },
      { Metric: 'Pending', Value: appointments.filter(a => a.status === 'Pending').length },
      { Metric: 'Accepted', Value: appointments.filter(a => a.status === 'Accepted').length },
      { Metric: 'Declined', Value: appointments.filter(a => a.status === 'Declined').length },
      { Metric: 'Rescheduled', Value: appointments.filter(a => a.status === 'Rescheduled').length },
      { Metric: 'Today\'s visit requests', Value: appointments.filter(a => a.appointment_date.startsWith(today)).length },
      { Metric: 'Acceptance Rate', Value: appointments.length > 0 ? Math.round((appointments.filter(a => a.status === 'Accepted').length / appointments.length) * 100) + '%' : '0%' },
    ];
    
    const headers = ['Metric', 'Value'];
    const csvContent = [
      headers.join(','),
      ...statsData.map(row => `${row.Metric},${row.Value}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `daily_statistics_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Daily statistics exported');
  };

  const handleExportStaff = () => {
    if (!user) {
      showToast('No user data available');
      return;
    }
    
    const staffData = [{
      Name: user.full_name || '',
      Email: user.email || '',
      Department: user.department_name || '',
      Role: user.role || 'Staff',
    }];
    
    const headers = ['Name', 'Email', 'Department', 'Role'];
    const csvContent = [
      headers.join(','),
      ...staffData.map(row => `${row.Name},${row.Email},${row.Department},${row.Role}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `staff_profile_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Staff profile exported');
  };

  const getOverdueHours = (dateStr) => {
    const apptDate = new Date(dateStr);
    const now = new Date();
    const diffMs = now - apptDate;
    return Math.floor(diffMs / (1000 * 60 * 60));
  };

  const recentAppointments = [...appointments]
    .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))
    .slice(0, 3);

  return (
    <div className="sd-container">
      {/* Toast Notification */}
      {toast && (
        <div className="sd-toast">
          <span>{toast}</span>
          <button onClick={() => setToast('')}>{ICONS.x}</button>
        </div>
      )}

      {/* Sidebar */}
      {sidebarOpen && <div className="sd-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true"></div>}
      <aside className={`sd-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sd-sidebar-header">
          <div className="sd-brand">
            <div className="sd-brand-icon">{ICONS.calendar}</div>
            <div>
              <div className="sd-brand-name">Gatepass</div>
              <div className="sd-brand-role">Staff Portal</div>
            </div>
          </div>
        </div>

        <div className="sd-user-card">
          <div className="sd-user-avatar">{getInitials(user?.full_name)}</div>
          <div className="sd-user-info">
            <div className="sd-user-name">{user?.full_name || 'Staff Member'}</div>
            <div className="sd-user-dept">
              {user?.department_name || 'No Department'}
              {user?.division_name && ` / ${user.division_name}`}
            </div>
          </div>
        </div>

        <nav className="sd-nav">
          <div className="sd-nav-section">MAIN</div>
          <button className={`sd-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}>
            {ICONS.dashboard}<span>Dashboard</span>
          </button>
          <button className={`sd-nav-item ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => { setActiveTab('appointments'); setSidebarOpen(false); }}>
            {ICONS.calendar}<span>Visitor queue</span>
            <span className="sd-nav-badge">{stats.pending}</span>
          </button>
          <button className={`sd-nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => { setActiveTab('schedule'); setSidebarOpen(false); }}>
            {ICONS.clock}<span>Schedule</span>
          </button>

          <div className="sd-nav-section">MANAGE</div>
          <button className={`sd-nav-item ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => { setActiveTab('pending'); setSidebarOpen(false); }}>
            {ICONS.activity}<span>Pending</span>
            <span className="sd-nav-badge red">{stats.pending}</span>
          </button>
          <button className={`sd-nav-item ${activeTab === 'accepted' ? 'active' : ''}`} onClick={() => { setActiveTab('accepted'); setSidebarOpen(false); }}>
            {ICONS.check}<span>Accepted</span>
          </button>
          <button className={`sd-nav-item ${activeTab === 'declined' ? 'active' : ''}`} onClick={() => { setActiveTab('declined'); setSidebarOpen(false); }}>
            {ICONS.x}<span>Declined</span>
          </button>
          <button className={`sd-nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setSidebarOpen(false); }}>
            {ICONS.refresh}<span>History</span>
          </button>

          <div className="sd-nav-section">ACTIONS</div>
          <button className="sd-nav-item" onClick={() => { handleExportCSV(); setSidebarOpen(false); }}>
            {ICONS.download}<span>Export visitor queue</span>
          </button>
          <button className="sd-nav-item" onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}>
            {ICONS.settings}<span>Settings</span>
          </button>
        </nav>

        <div className="sd-sidebar-footer">
          <button className="sd-logout-btn" onClick={handleLogout}>
            {ICONS.logout}<span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="sd-main">
        {/* Top Bar */}
        <header className="sd-topbar">
          <div className="sd-topbar-left">
            <button className="sd-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {ICONS.menu}
            </button>
            <div className="sd-search-box">
              {ICONS.search}
              <input 
                type="text" 
                placeholder="Search visitor requests..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="sd-topbar-right">
            <div className="sd-date-display">
              {getDateLabel()} - {getTimeLabel()}
            </div>
            <button
              className={`sd-availability-toggle ${isCurrentlyAvailable ? 'online' : 'offline'}`}
              onClick={handleAvailabilityToggle}
              disabled={availabilityLoading}
              aria-live="polite"
            >
              <span className="sd-availability-icon" aria-hidden="true">
                {isCurrentlyAvailable ? ICONS.check : ICONS.alertCircle}
              </span>
              <span className="sd-availability-dot" aria-hidden="true"></span>
              <span className="sd-availability-text">
                {isCurrentlyAvailable ? 'Available' : 'Unavailable'}
              </span>
            </button>
            <div className="sd-notification-wrapper" ref={notificationRef}>
              <button className="sd-icon-btn" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                {ICONS.bell}
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="sd-notification-badge">{notifications.filter(n => !n.read).length}</span>
                )}
              </button>
              {notificationsOpen && (
                <div className="sd-notification-dropdown">
                  <div className="sd-notification-header">
                    <div className="sd-notification-header-left">
                      <h4>Notifications</h4>
                      {notifications.length > 0 && (
                        <span className="sd-notification-count">{notifications.filter(n => !n.read).length} unread</span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button onClick={() => { setNotifications([]); setNotificationsOpen(false); }} className="sd-clear-all-btn">Clear all</button>
                    )}
                  </div>
                  <div className="sd-notification-list">
                    {notifications.length === 0 ? (
                      <div className="sd-notification-empty">
                        <div className="sd-notification-empty-icon">{ICONS.bell}</div>
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div key={n.id} className={`sd-notification-item ${!n.read ? 'unread' : ''}`} onClick={() => {
                          setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                          setNotificationsOpen(false);
                        }}>
                          <div className="sd-notification-dot"></div>
                          <div className="sd-notification-content">
                            <p>{n.message}</p>
                            <span>{n.time}</span>
                          </div>
                          <button 
                            className="sd-notification-clear" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotifications(prev => prev.filter(item => item.id !== n.id));
                            }}
                            title="Clear this notification"
                          >
                            {ICONS.x}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button className="sd-icon-btn" onClick={() => loadMyAppointments().then(() => showToast('Refreshed!'))}>{ICONS.refresh}</button>
            <div className="sd-avatar">{getInitials(user?.full_name)}</div>
          </div>
        </header>

        {showOverdueAnnouncement && (
          <div
            className="sd-overdue-announcement"
            role="button"
            tabIndex={0}
            onClick={handleOverdueAnnouncementClick}
            onKeyDown={handleOverdueAnnouncementKeyDown}
          >
            <div>
              <p className="sd-overdue-announcement-title">⚠️ {overdueAppointments.length} pending requests overdue</p>
              <p className="sd-overdue-announcement-detail">
                Tap to open {overdueAppointments[0]?.visitor_name || 'the oldest request'} and see what needs attention.
              </p>
            </div>
            <div className="sd-overdue-meta">
              <span>Sent {getRelativeTimeLabel(overdueAppointments[0]?.created_at || overdueAppointments[0]?.appointment_date)}</span>
              <span className="sd-overdue-cta">Open now →</span>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="sd-content">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="sd-stats-grid">
                <div className="sd-stat-card">
                  <div className="sd-stat-icon" style={{ background: 'var(--gold-light)', color: 'var(--gold-dark)' }}>
                    {ICONS.clock}
                  </div>
                  <div className="sd-stat-info">
                    <div className="sd-stat-value">{stats.pending}</div>
                    <div className="sd-stat-label">Pending</div>
                  </div>
                </div>
                <div className="sd-stat-card">
                  <div className="sd-stat-icon" style={{ background: 'var(--green-light)', color: 'var(--green-dark)' }}>
                    {ICONS.check}
                  </div>
                  <div className="sd-stat-info">
                    <div className="sd-stat-value">{stats.accepted}</div>
                    <div className="sd-stat-label">Accepted</div>
                  </div>
                </div>
                <div className="sd-stat-card">
                  <div className="sd-stat-icon" style={{ background: 'var(--teal-light)', color: 'var(--teal-dark)' }}>
                    {ICONS.calendar}
                  </div>
                  <div className="sd-stat-info">
                    <div className="sd-stat-value">{stats.today}</div>
                    <div className="sd-stat-label">Today</div>
                  </div>
                </div>
                <div className="sd-stat-card">
                  <div className="sd-stat-icon" style={{ background: '#e6f4f2', color: 'var(--teal)' }}>
                    {ICONS.activity}
                  </div>
                  <div className="sd-stat-info">
                    <div className="sd-stat-value">{stats.acceptRate}%</div>
                    <div className="sd-stat-label">Accept Rate</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="sd-section">
                <div className="sd-section-header">
                  <h3>Quick Actions</h3>
                </div>
                <div className="sd-actions-grid">
                  <button className="sd-action-card" onClick={() => setActiveTab('appointments')}>
                    <div className="sd-action-icon sd-action-icon-teal">{ICONS.calendar}</div>
                    <span>View visitor queue</span>
                  </button>
                  <button className="sd-action-card" onClick={() => setActiveTab('pending')}>
                    <div className="sd-action-icon sd-action-icon-gold">{ICONS.activity}</div>
                    <span>Review Pending</span>
                  </button>
                  <button className="sd-action-card" onClick={handleExportCSV}>
                    <div className="sd-action-icon sd-action-icon-green">{ICONS.download}</div>
                    <span>Export Data</span>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="sd-section">
                <div className="sd-panel">
                  <div className="sd-panel-header">
                    <h3>{ICONS.activity} Recent Activity</h3>
                  </div>
                  <div className="sd-list">
                    {recentAppointments.length === 0 ? (
                      <div className="sd-empty">No recent visitor requests</div>
                    ) : (
                      recentAppointments.map(apt => (
                        <div key={apt.id} className="sd-list-item" onClick={() => openPreview(apt)}>
                          <div className="sd-list-avatar" style={{ 
                            background: apt.status === 'Pending' ? 'var(--gold-light)' : 
                                       apt.status === 'Accepted' ? 'var(--green-light)' : 'var(--red-light)',
                            color: apt.status === 'Pending' ? 'var(--gold-dark)' : 
                                   apt.status === 'Accepted' ? 'var(--green-dark)' : 'var(--red-dark)'
                          }}>
                            {getInitials(apt.visitor_name)}
                          </div>
                          <div className="sd-list-info">
                            <div className="sd-list-name">{apt.visitor_name}</div>
                            <div className="sd-list-meta">
                              {formatDate(apt.appointment_date)} - {formatTime(apt.appointment_date)}
                              <span className="sd-list-time-since">Sent {getRelativeTimeLabel(apt.created_at)}</span>
                            </div>
                          </div>
                          <span className={`sd-badge sd-badge-${apt.status?.toLowerCase()}`}>{apt.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {(activeTab === 'appointments' || activeTab === 'pending' || activeTab === 'accepted' || activeTab === 'declined' || activeTab === 'history') && (
            <>
              {/* Filter Bar */}
              <div className="sd-filter-bar">
                <div className="sd-filter-tabs">
                  <button className={`sd-filter-tab ${dateFilter === 'all' ? 'active' : ''}`} onClick={() => setDateFilter('all')}>All</button>
                  <button className={`sd-filter-tab ${dateFilter === 'today' ? 'active' : ''}`} onClick={() => setDateFilter('today')}>Today</button>
                </div>
                <div className="sd-filter-actions">
                  <div className="sd-view-toggle">
                    <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>{ICONS.grid}</button>
                    <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>{ICONS.list}</button>
                  </div>
                  <button className="sd-export-btn" onClick={handleExportCSV}>
                    {ICONS.download} Export
                  </button>
                </div>
              </div>

              {/* Appointments Grid/List */}
              <div className="sd-appointments-container">
                {filteredAppointments.length === 0 ? (
                  <div className="sd-empty-state">
                    {ICONS.calendar}
                    <h3>No visit requests found</h3>
                    <p>There are no visit requests matching your criteria.</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="sd-appointments-grid">
                    {filteredAppointments.map(apt => {
                      const overdueHours = apt.status === 'Pending' ? getOverdueHours(apt.appointment_date) : 0;
                      const isUrgent = overdueHours > 24;
                      
                      return (
                        <div key={apt.id} className={`sd-appt-card ${isUrgent ? 'urgent' : ''}`}>
                          <div className="sd-appt-header">
                            <div className="sd-appt-avatar" style={{ 
                              background: isUrgent ? 'var(--red-light)' : apt.status === 'Accepted' ? 'var(--green-light)' : apt.status === 'Declined' ? 'var(--red-light)' : 'var(--gold-light)',
                              color: isUrgent ? 'var(--red-dark)' : apt.status === 'Accepted' ? 'var(--green-dark)' : apt.status === 'Declined' ? 'var(--red-dark)' : 'var(--gold-dark)'
                            }}>
                              {getInitials(apt.visitor_name)}
                            </div>
                            <div className="sd-appt-status-stack">
                              <span className={`sd-badge sd-badge-${apt.status?.toLowerCase()}`}>{apt.status}</span>
                              <div className="sd-appt-since">
                                <span className="sd-appt-since-icon">{ICONS.clock}</span>
                                <span>Sent {getRelativeTimeLabel(apt.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="sd-appt-body">
                            <h4 className="sd-appt-name">{apt.visitor_name}</h4>
                            <p className="sd-appt-email">{apt.visitor_email}</p>
                            
                            <div className="sd-appt-details">
                              <div className="sd-appt-detail">
                                {ICONS.calendar}
                                <span>{formatDate(apt.appointment_date)}</span>
                              </div>
                              <div className="sd-appt-detail">
                                {ICONS.clock}
                                <span>{formatTime(apt.appointment_date)}</span>
                              </div>
                              {apt.service?.name && (
                                <div className="sd-appt-detail">
                                  {ICONS.activity}
                                  <span>{apt.service.name}</span>
                                </div>
                              )}
                            </div>
                            
                            {apt.message && (
                              <p className="sd-appt-message">"{apt.message}"</p>
                            )}
                          </div>

                          {apt.status === 'Pending' ? (
                            <div className="sd-appt-actions">
                              <button className="sd-btn sd-btn-accept" onClick={() => openResponseArea(apt.id, 'Accepted')}>Accept</button>
                              <button className="sd-btn sd-btn-reschedule" onClick={() => openResponseArea(apt.id, 'Rescheduled')}>Reschedule</button>
                              <button className="sd-btn sd-btn-decline" onClick={() => openResponseArea(apt.id, 'Declined')}>Decline</button>
                            </div>
                          ) : (
                            <div className="sd-appt-actions">
                              <button className="sd-btn sd-btn-view" onClick={() => openPreview(apt)}>View Details</button>
                            </div>
                          )}

                          {responseAreaOpen[apt.id] && (
                            <div className="sd-response-area">
                              <textarea 
                                placeholder="Add a response note (optional)..."
                                value={responseNote[apt.id] || ''}
                                onChange={(e) => setResponseNote(prev => ({ ...prev, [apt.id]: e.target.value }))}
                                rows="2"
                              />
                              <div className="sd-response-actions">
                                <button 
                                  className="sd-btn sd-btn-accept"
                                  onClick={() => {
                                    requestStatusUpdate(apt.id, apt.visitor_name, responseAction[apt.id] || 'Accepted');
                                  }}
                                >
                                  Send & {responseAction[apt.id] || 'Accept'}
                                </button>
                                <button className="sd-btn sd-btn-view" onClick={() => closeResponseArea(apt.id)}>Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="sd-appointments-list-view">
                    <div className="sd-list-toolbar">
                      <button type="button" className="sd-list-back" onClick={() => setViewMode('grid')}>Return to grid</button>
                      <span className="sd-list-count">{filteredAppointments.length} requests</span>
                    </div>
                    <div className="sd-list-items">
                      {filteredAppointments.map((apt) => (
                        <div key={apt.id} className="sd-list-simple-card">
                          <button
                            type="button"
                            className="sd-list-simple"
                            onClick={() => openPreview(apt)}
                          >
                            <div>
                              <div className="sd-list-simple-name">{apt.visitor_name}</div>
                              <div className="sd-list-simple-time">Sent {getRelativeTimeLabel(apt.created_at)}</div>
                            </div>
                            <div className="sd-list-simple-meta-group">
                              <span className={`sd-list-simple-status sd-list-simple-status-${apt.status?.toLowerCase()}`}>{apt.status}</span>
                              <span className="sd-list-simple-meta">{formatSentTime(apt.created_at || apt.appointment_date)}</span>
                            </div>
                          </button>
                          <div className="sd-list-simple-actions">
                            <button className="sd-btn sd-btn-accept" onClick={() => openResponseArea(apt.id, 'Accepted')}>Accept</button>
                            <button className="sd-btn sd-btn-reschedule" onClick={() => openResponseArea(apt.id, 'Rescheduled')}>Reschedule</button>
                            <button className="sd-btn sd-btn-decline" onClick={() => openResponseArea(apt.id, 'Declined')}>Decline</button>
                          </div>
                          {responseAreaOpen[apt.id] && (
                            <div className="sd-response-area sd-response-area-list">
                              <textarea
                                placeholder="Add a response note..."
                                value={responseNote[apt.id] || ''}
                                onChange={(e) => setResponseNote(prev => ({ ...prev, [apt.id]: e.target.value }))}
                                rows="2"
                              />
                              <div className="sd-response-actions sd-response-actions-list">
                                <button
                                  className="sd-btn sd-btn-accept"
                                  onClick={() => {
                                    requestStatusUpdate(apt.id, apt.visitor_name, responseAction[apt.id] || 'Accepted');
                                  }}
                                >
                                  Send & {responseAction[apt.id] || 'Accept'}
                                </button>
                                <button className="sd-btn sd-btn-view" onClick={() => closeResponseArea(apt.id)}>Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'schedule' && (
            <div className="sd-schedule-view">
              <div className="sd-panel">
                <div className="sd-panel-header">
                  <h3>{ICONS.calendar} Today's Schedule</h3>
                </div>
                <div className="sd-timeline">
                  {appointments.filter(a => a.appointment_date.startsWith(today)).length === 0 ? (
                    <div className="sd-empty">No visit requests scheduled for today</div>
                  ) : (
                    appointments
                      .filter(a => a.appointment_date.startsWith(today))
                      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
                      .map(apt => (
                        <div key={apt.id} className="sd-timeline-item">
                          <div className="sd-timeline-time">{formatTime(apt.appointment_date)}</div>
                          <div className="sd-timeline-dot"></div>
                          <div className="sd-timeline-content">
                            <div className="sd-timeline-name">{apt.visitor_name}</div>
                            <div className="sd-timeline-meta">{apt.service?.name || 'Appointment'}</div>
                            <div className="sd-timeline-since">Sent {getRelativeTimeLabel(apt.created_at)}</div>
                          </div>
                          <span className={`sd-badge sd-badge-${apt.status?.toLowerCase()}`}>{apt.status}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="sd-settings-view">
              <div className="sd-panel">
                <div className="sd-panel-header">
                  <h3>{ICONS.settings} Settings</h3>
                </div>
                <div className="sd-settings-content">
                  <div className="sd-setting-item">
                    <div className="sd-setting-info">
                      <h4>Profile Information</h4>
                      <p>Update your personal information</p>
                    </div>
                    <div className="sd-setting-value">
                      <span>{user?.full_name}</span>
                      <span>{user?.email}</span>
                    </div>
                  </div>
                  <div className="sd-setting-item">
                    <div className="sd-setting-info">
                      <h4>Department</h4>
                      <p>Your assigned department</p>
                    </div>
                    <div className="sd-setting-value">
                      <span>{user?.department_name || 'Not assigned'}</span>
                    </div>
                  </div>
                  <div className="sd-setting-item">
                    <div className="sd-setting-info">
                      <h4>Session</h4>
                      <p>Auto-refresh appointments every 15 seconds</p>
                    </div>
                    <button className="sd-btn sd-btn-view" onClick={handleLogout}>Sign Out</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {previewItem && (
        <div className="sd-modal-overlay" onClick={closePreview}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <h3>Appointment Details</h3>
              <button onClick={closePreview}>{ICONS.x}</button>
            </div>
            <div className="sd-modal-body">
              <div className="sd-modal-avatar" style={{ 
                background: previewItem.status === 'Pending' ? 'var(--gold-light)' : 
                           previewItem.status === 'Accepted' ? 'var(--green-light)' : 'var(--red-light)',
                color: previewItem.status === 'Pending' ? 'var(--gold-dark)' : 
                       previewItem.status === 'Accepted' ? 'var(--green-dark)' : 'var(--red-dark)'
              }}>
                {getInitials(previewItem.visitor_name)}
              </div>
              <h4>{previewItem.visitor_name}</h4>
              <p className="sd-modal-email">{previewItem.visitor_email}</p>
              
              <div className="sd-modal-details">
                <div className="sd-modal-detail">
                  <span>Date</span>
                  <strong>{formatDate(previewItem.appointment_date)}</strong>
                </div>
                <div className="sd-modal-detail">
                  <span>Time</span>
                  <strong>{formatTime(previewItem.appointment_date)}</strong>
                </div>
                <div className="sd-modal-detail">
                  <span>Status</span>
                  <span className={`sd-badge sd-badge-${previewItem.status?.toLowerCase()}`}>{previewItem.status}</span>
                </div>
              </div>

              {previewItem.message && (
                <div className="sd-modal-section">
                  <h5>Visitor Message</h5>
                  <p>{previewItem.message}</p>
                </div>
              )}

              {previewItem.response_note && (
                <div className="sd-modal-section">
                  <h5>Staff Response</h5>
                  <p>{previewItem.response_note}</p>
                </div>
              )}
            </div>
            <div className="sd-modal-footer">
              <button type="button" className="sd-btn sd-btn-view" onClick={closePreview}>Return</button>
              {previewItem.status === 'Pending' && (
                <>
                  <button className="sd-btn sd-btn-accept" onClick={() => { closePreview(); openResponseArea(previewItem.id, 'Accepted'); }}>Accept</button>
                  <button className="sd-btn sd-btn-decline" onClick={() => { closePreview(); openResponseArea(previewItem.id, 'Declined'); }}>Decline</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(pendingStatusUpdate)}
        title={`Confirm ${pendingStatusUpdate?.status || ''}`}
        message={
          pendingStatusUpdate
            ? `Update ${pendingStatusUpdate.visitorName}'s visit request to "${pendingStatusUpdate.status}"?`
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

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        title="Delete visit request(s)?"
        message={
          pendingDelete?.type === 'single'
            ? 'Delete this visit request?'
            : `Delete ${pendingDelete?.ids?.length || 0} selected visit requests?`
        }
        confirmText="Delete"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
