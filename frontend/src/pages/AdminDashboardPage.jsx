import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

// Mock notifications data
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    category: 'escalation',
    title: '5 visit requests exceeding 24h pending',
    message: 'The following staff have unresponded visit requests older than 24 hours: Alice Mwangi (2), Brian Otieno (2), Carol Njeri (1). Consider reassigning or sending a manual reminder.',
    time: '2 minutes ago',
    unread: true,
    urgent: true,
    date: 'Today',
    staff: ['Alice Mwangi', 'Brian Otieno', 'Carol Njeri'],
  },
  {
    id: 2,
    category: 'staff',
    title: 'New Staff Account Created',
    message: 'You successfully created an account for David Kamau (Operations - Logistics). A welcome email with temporary credentials was sent to david@org.com. Staff must change password on first login.',
    time: '34 minutes ago',
    unread: true,
    urgent: false,
    date: 'Today',
    staff: ['David Kamau'],
  },
  {
    id: 3,
    category: 'appointments',
    title: 'Visit request volume spike - Engineering Dept',
    message: 'Engineering received 14 new visit requests in the last 2 hours - 3x above the daily average. Staff in this department may need support or temporary reallocation.',
    time: '1 hour ago',
    unread: true,
    urgent: false,
    date: 'Today',
    staff: [],
  },
  {
    id: 4,
    category: 'security',
    title: 'Login from Unrecognised Device - Alice Mwangi',
    message: 'Alice Mwangi signed in from a new device at 08:14 AM. Location: Nairobi, KE - Browser: Chrome - IP: 102.89.x.x. If this was not authorised, consider forcing a password reset immediately.',
    time: '2 hours ago',
    unread: true,
    urgent: false,
    date: 'Today',
    staff: ['Alice Mwangi'],
  },
  {
    id: 5,
    category: 'report',
    title: 'Daily Morning Digest - March 10',
    message: 'Yesterday: 46 visit requests processed - 38 accepted - 4 declined - 4 rescheduled. Fastest responder: Brian Otieno (avg 18 min). Slowest: Carol Njeri (avg 4.2 hrs). 2 FCM push notifications failed to deliver.',
    time: '7:00 AM today',
    unread: false,
    urgent: false,
    date: 'Today',
    staff: ['Brian Otieno', 'Carol Njeri'],
  },
  {
    id: 6,
    category: 'staff',
    title: 'Staff Account Deactivated',
    message: 'You deactivated Carol Njeri\'s account (HR - Recruitment). Her 3 pending visit requests were left unassigned. Consider reassigning them to another HR staff member.',
    time: 'Yesterday, 4:22 PM',
    unread: false,
    urgent: false,
    date: 'Yesterday',
    staff: ['Carol Njeri'],
  },
  {
    id: 7,
    category: 'report',
    title: 'Weekly Performance Report - Week 10',
    message: '284 visit requests processed last week. Overall acceptance rate: 87%. Average response time improved by 18 minutes vs the previous week. Engineering remained the busiest department for the 3rd consecutive week.',
    time: 'Monday, 7:00 AM',
    unread: false,
    urgent: false,
    date: 'Yesterday',
    staff: [],
  },
];

// Notification categories config
const NOTIF_CATEGORIES = {
  escalation: { color: 'var(--red)', bg: '#ef444415', border: 'var(--red-dim)', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  staff: { color: 'var(--green)', bg: '#22c55e15', border: 'var(--green-dim)', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  appointments: { color: 'var(--amber)', bg: '#f59e0b15', border: 'var(--amber-dim)', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  security: { color: 'var(--purple)', bg: '#a78bfa15', border: 'var(--purple-dim)', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  report: { color: 'var(--cyan)', bg: '#22d3ee15', border: 'var(--cyan-dim)', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
};
const EAT_TIMEZONE = 'Africa/Nairobi';

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function Badge({ role }) {
  const colors = { Admin: 'badge-amber', Staff: 'badge-cyan' };
  return <span className={`badge ${colors[role] || 'badge-muted'}`}>{role}</span>;
}

function StatusBadge({ status }) {
  const statusColors = {
    Active: 'badge-green',
    Inactive: 'badge-muted',
    Pending: 'badge-amber',
    Accepted: 'badge-green',
    Declined: 'badge-red',
    Rescheduled: 'badge-cyan',
  };
  return <span className={`badge ${statusColors[status] || 'badge-muted'}`}>{status}</span>;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  
  // Notifications state
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [bellDropdownOpen, setBellDropdownOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all'); // all, unread, urgent, archived
  const [notifTypeFilter, setNotifTypeFilter] = useState('all'); // all, escalation, staff, appointments, security, report
  const [notifSearch, setNotifSearch] = useState('');
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [lastNotifUpdate, setLastNotifUpdate] = useState(new Date());
  
  const unreadCount = notifications.filter(n => n.unread).length;
  const urgentCount = notifications.filter(n => n.urgent).length;
  const todayCount = notifications.filter(n => n.date === 'Today').length;
  
  const filteredNotifications = notifications.filter(n => {
    if (notifFilter === 'unread' && !n.unread) return false;
    if (notifFilter === 'urgent' && !n.urgent) return false;
    if (notifFilter === 'archived') return false;
    if (notifTypeFilter !== 'all' && n.category !== notifTypeFilter) return false;
    if (notifSearch) {
      const query = notifSearch.toLowerCase();
      const haystack = `${n.title} ${n.message}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
  
  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };
  
  const dismissNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const exportAppointmentsReport = () => {
    if (allAppointments.length === 0) {
      showToast('No visit requests to export.', 'error');
      return;
    }
    const rows = [
      ['ID', 'Visitor Name', 'Visitor Email', 'Staff Name', 'Department', 'Status', 'Visit Date'],
      ...allAppointments.map((a) => [
        a.id,
        a.visitor_name,
        a.visitor_email,
        a.staff_name,
        a.department_name,
        a.status,
        a.appointment_date,
      ]),
    ];
    const csvContent = rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `visit_requests_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Report exported.');
  };

  const openNotifications = () => {
    setActiveNav('notifications');
    setBellDropdownOpen(false);
  };

  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [staff, setStaff] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    tone: 'default',
    action: null,
  });

  // Staff Modal State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffForm, setStaffForm] = useState({
    full_name: '',
    email: '',
    role: 'Staff',
    department: '',
    division: '',
    password: generatePassword(),
    phone_number: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [staffToast, setStaffToast] = useState(null);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [appointmentSearch, setAppointmentSearch] = useState('');

  // Reassign Modal
  const [reassignModal, setReassignModal] = useState(null);
  const [reassignStaff, setReassignStaff] = useState('');

  // Form states
  const [newDeptName, setNewDeptName] = useState('');
  const [newDivName, setNewDivName] = useState('');
  const [newDivDept, setNewDivDept] = useState('');
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editingDeptName, setEditingDeptName] = useState('');
  const [editingDivId, setEditingDivId] = useState(null);
  const [editingDivName, setEditingDivName] = useState('');
  const [editingDivDept, setEditingDivDept] = useState('');

  const loadData = useCallback(async () => {
    const [depRes, divRes, staffRes, apptRes] = await Promise.all([
      api.get('/departments/'),
      api.get('/divisions/'),
      api.get('/staff/?include_inactive=1'),
      api.get('/appointments/my/'),
    ]);
    setDepartments(depRes.data);
    setDivisions(divRes.data);
    setStaff(staffRes.data);
    setAllAppointments(apptRes.data);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadData().catch(() => {});
    }, 15000);
    return () => clearInterval(intervalId);
  }, [loadData]);

  useEffect(() => {
    setLastNotifUpdate(new Date());
  }, [notifications]);

  useEffect(() => {
    document.body.classList.add('admin-background');
    return () => {
      document.body.classList.remove('admin-background');
    };
  }, []);

  const showToast = (msg, type = 'success') => {
    setStaffToast({ msg, type });
    setTimeout(() => setStaffToast(null), 3000);
  };

  // Department functions
  const createDepartment = async (e) => {
    e.preventDefault();
    await api.post('/departments/', { name: newDeptName });
    setNewDeptName('');
    await loadData();
    showToast('Department created successfully');
  };

  const createDivision = async (e) => {
    e.preventDefault();
    await api.post('/divisions/', { name: newDivName, department: newDivDept });
    setNewDivName('');
    setNewDivDept('');
    await loadData();
    showToast('Division created successfully');
  };

  const saveDepartment = async () => {
    if (!editingDeptId) return;
    await api.patch(`/departments/${editingDeptId}/`, { name: editingDeptName });
    setEditingDeptId(null);
    setEditingDeptName('');
    await loadData();
  };

  const saveDivision = async () => {
    if (!editingDivId) return;
    await api.patch(`/divisions/${editingDivId}/`, { name: editingDivName, department: editingDivDept });
    setEditingDivId(null);
    setEditingDivName('');
    setEditingDivDept('');
    await loadData();
  };

  const deleteDepartment = async (id) => {
    await api.delete(`/departments/${id}/`);
    await loadData();
  };

  const deleteDivision = async (id) => {
    await api.delete(`/divisions/${id}/`);
    await loadData();
  };

  // Staff functions
  const openCreateStaff = () => {
    setEditingStaffId(null);
    setStaffForm({
      full_name: '',
      email: '',
      role: 'Staff',
      department: '',
      division: '',
      password: generatePassword(),
      phone_number: '',
    });
    setShowPassword(false);
    setShowStaffModal(true);
  };

  const openEditStaff = (s) => {
    setEditingStaffId(s.id);
    setStaffForm({
      full_name: s.full_name,
      email: s.email,
      role: s.role,
      department: String(s.department || ''),
      division: String(s.division || ''),
      password: '',
      phone_number: s.phone_number || '',
    });
    setShowStaffModal(true);
  };

  const handleStaffSubmit = async () => {
    if (!staffForm.full_name || !staffForm.email || !staffForm.department || !staffForm.division) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    setIsLoadingStaff(true);
    try {
      if (editingStaffId) {
        await api.patch(`/staff/${editingStaffId}/`, {
          full_name: staffForm.full_name,
          role: staffForm.role,
          department: staffForm.department || null,
          division: staffForm.division || null,
          phone_number: staffForm.phone_number || '',
        });
        showToast('Staff member updated.');
      } else {
        const response = await api.post('/staff/create/', {
          full_name: staffForm.full_name,
          email: staffForm.email,
          role: staffForm.role,
          department: staffForm.department,
          division: staffForm.division,
          password: staffForm.password,
          phone_number: staffForm.phone_number,
        });
        showToast(`Account created. Temp password: ${response.data.temp_password}`);
      }
      setShowStaffModal(false);
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'An error occurred.', 'error');
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const toggleStaffActive = async (s) => {
    try {
      if (s.is_active) {
        await api.patch(`/staff/${s.id}/deactivate/`);
        showToast(`${s.full_name} deactivated.`);
      } else {
        await api.patch(`/staff/${s.id}/activate/`);
        showToast(`${s.full_name} activated.`);
      }
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'An error occurred.', 'error');
    }
  };

  const handleDeleteStaff = async (id) => {
    await api.delete(`/staff/${id}/`);
    await loadData();
    showToast('Staff member deleted.', 'error');
  };

  const handleResetPassword = async (id) => {
    try {
      const response = await api.post(`/staff/${id}/reset-password/`, {});
      showToast(`New password: ${response.data.temp_password}`);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to reset password.', 'error');
    }
  };

  // Appointment functions
  const handleReassign = async () => {
    if (!reassignModal || !reassignStaff) return;
    try {
      await api.patch(`/appointments/reassign/${reassignModal.id}/`, {
        staff_member: parseInt(reassignStaff),
      });
      showToast(`Visit request reassigned to ${staff.find(s => s.id === parseInt(reassignStaff))?.full_name}`);
      setReassignModal(null);
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to reassign.', 'error');
    }
  };

  const handleDeleteAppointment = async (id) => {
    try {
      await api.delete(`/appointments/delete/${id}/`);
      showToast('Visit request deleted.');
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete.', 'error');
    }
  };

  const openConfirm = ({ title, message, confirmText, tone, action }) => {
    setConfirmDialog({
      isOpen: true,
      title: title || 'Please Confirm',
      message: message || 'Are you sure?',
      confirmText: confirmText || 'Confirm',
      tone: tone || 'default',
      action: action || null,
    });
  };

  const closeConfirm = () => {
    setConfirmDialog({ isOpen: false, title: '', message: '', confirmText: 'Confirm', tone: 'default', action: null });
  };

  const runConfirmAction = async () => {
    const action = confirmDialog.action;
    closeConfirm();
    if (action) await action();
  };

  const handleLogout = () => {
    sessionStorage.setItem('app_toast', 'Logged out successfully.');
    logout();
    navigate('/staff/login');
  };

  // Analytics
  const analytics = {
    totalAppointments: allAppointments.length,
    pending: allAppointments.filter(a => a.status === 'Pending').length,
    accepted: allAppointments.filter(a => a.status === 'Accepted').length,
    declined: allAppointments.filter(a => a.status === 'Declined').length,
    rescheduled: allAppointments.filter(a => a.status === 'Rescheduled').length,
    totalStaff: staff.length,
    activeStaff: staff.filter(s => s.is_active).length,
    avgResponseTime: '1.4h',
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getDateLabel = () => {
    const date = new Date();
    const options = { timeZone: EAT_TIMEZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  const getWeekNumber = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: EAT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    const now = new Date(`${year}-${month}-${day}T00:00:00+03:00`);
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 604800000;
    return Math.ceil(diff / oneWeek);
  };

  const filteredStaff = staff.filter((s) => {
    if (!staffSearch) return true;
    const query = staffSearch.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query) ||
      s.department_name?.toLowerCase().includes(query) ||
      s.division_name?.toLowerCase().includes(query)
    );
  });

  const filteredAppointments = allAppointments.filter((a) => {
    if (!appointmentSearch) return true;
    const query = appointmentSearch.toLowerCase();
    return (
      a.visitor_name?.toLowerCase().includes(query) ||
      a.visitor_email?.toLowerCase().includes(query) ||
      a.staff_name?.toLowerCase().includes(query) ||
      a.department_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className={`shell ${navOpen ? 'nav-open' : ''}`}>
      {/* Toast */}
      {staffToast && (
        <div className={`toast-admin ${staffToast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {staffToast.msg}
        </div>
      )}

      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-logo">
          <div className="logo-mark"></div>
        </div>
        <div className="topbar-brand">
          <div>
            <div className="brand-text">GATEPASS</div>
            <div className="brand-sub">Control Center</div>
          </div>
        </div>
        <div className="topbar-center">
          <div className="breadcrumb">
            <span>System</span>
            <span>/</span>
            <strong>Admin Dashboard</strong>
          </div>
        </div>
        <div className="topbar-right">
          <button
            className="shell-nav-toggle"
            type="button"
            aria-label="Toggle menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((prev) => !prev)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="search-wrap">
            <input className="search-bar" placeholder="Search anything..." />
          </div>
          <div className="topbar-icon-btn" title="Notifications" onClick={() => setBellDropdownOpen(!bellDropdownOpen)} style={{ position: 'relative' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && <div className="notif-badge">{unreadCount}</div>}
            
            {/* Bell Dropdown */}
            {bellDropdownOpen && (
              <div className="bell-dropdown">
                <div className="dropdown-head">
                  <div className="dropdown-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    Notifications
                    <span style={{ background: 'var(--red)', color: '#fff', fontSize: '9px', padding: '1px 6px', borderRadius: '10px', fontFamily: 'DM Mono,monospace' }}>{unreadCount} new</span>
                  </div>
                  <div className="dropdown-actions">
                    <span className="dropdown-link" onClick={(e) => { e.stopPropagation(); markAllRead(); }}>Mark all read</span>
                  </div>
                </div>
                
                {notifications.slice(0, 5).map((notif) => {
                  const cat = NOTIF_CATEGORIES[notif.category] || NOTIF_CATEGORIES.appointments;
                  return (
                    <div key={notif.id} className={`dropdown-item ${notif.unread ? 'unread' : ''}`} onClick={openNotifications}>
                      <div className="di-icon" style={{ background: cat.bg, border: '1px solid ' + cat.border }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="2">
                          <path d={cat.icon}></path>
                        </svg>
                      </div>
                      <div className="di-text">
                        <div className="di-title">{notif.title}</div>
                        <div className="di-time">{notif.time}</div>
                      </div>
                      {notif.unread && <div className="di-dot" style={{ background: cat.color }}></div>}
                    </div>
                  );
                })}
                
                <div className="dropdown-footer">
                  <a onClick={(e) => { e.stopPropagation(); openNotifications(); }}>View all notifications</a>
                </div>
              </div>
            )}
          </div>
          <div className="topbar-icon-btn" title="Settings" onClick={() => setActiveNav('settings')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </div>
          <div className="avatar">{getInitials(user?.full_name || 'AD')}</div>
        </div>
      </header>
      <div className={`shell-backdrop ${navOpen ? 'open' : ''}`} onClick={() => setNavOpen(false)}></div>

      {/* Icon Rail */}
      <nav className="icon-rail">
        <div className={`rail-icon ${activeNav === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveNav('dashboard')} title="Dashboard">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </div>
        <div className={`rail-icon ${activeNav === 'appointments' ? 'active' : ''}`} onClick={() => setActiveNav('appointments')} title="Visitor log">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </div>
        <div className={`rail-icon ${activeNav === 'staff' ? 'active' : ''}`} onClick={() => setActiveNav('staff')} title="Staff">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div className={`rail-icon ${activeNav === 'departments' ? 'active' : ''}`} onClick={() => setActiveNav('departments')} title="Departments">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18"></path>
            <path d="M5 21V7l8-4v18"></path>
            <path d="M19 21V11l-6-4"></path>
            <path d="M9 9v.01"></path>
            <path d="M9 12v.01"></path>
            <path d="M9 15v.01"></path>
            <path d="M9 18v.01"></path>
          </svg>
        </div>
        <div className="rail-divider"></div>
        <div className={`rail-icon ${activeNav === 'reports' ? 'active' : ''}`} onClick={() => setActiveNav('reports')} title="Reports">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </div>
        <div className={`rail-icon ${activeNav === 'notifications' ? 'active' : ''}`} onClick={() => setActiveNav('notifications')} title="Notifications">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </div>
        <div className="rail-divider"></div>
        <div className="rail-icon" style={{ marginTop: 'auto' }} onClick={handleLogout} title="Logout">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
        <div className="nav-section-label">Overview</div>
        <div className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveNav('dashboard')}>
          <span className="nav-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </span>
          Dashboard
        </div>
        <div className={`nav-item ${activeNav === 'analytics' ? 'active' : ''}`} onClick={() => setActiveNav('analytics')}>
          <span className="nav-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </span>
          Analytics
        </div>

        <div className="nav-section-label">Management</div>
        <div className={`nav-item ${activeNav === 'appointments' ? 'active' : ''}`} onClick={() => setActiveNav('appointments')}>
          <span className="nav-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </span>
          Visitor log
          <span className="nav-badge red">{analytics.pending}</span>
        </div>
        <div className={`nav-item ${activeNav === 'staff' ? 'active' : ''}`} onClick={() => setActiveNav('staff')}>
          <span className="nav-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
          </span>
          Staff
          <span className="nav-badge">{staff.length}</span>
        </div>
        <div className={`nav-item ${activeNav === 'departments' ? 'active' : ''}`} onClick={() => setActiveNav('departments')}>
          <span className="nav-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18"></path>
              <path d="M5 21V7l8-4v18"></path>
              <path d="M19 21V11l-6-4"></path>
            </svg>
          </span>
          Departments
        </div>
        <div className={`nav-item ${activeNav === 'divisions' ? 'active' : ''}`} onClick={() => setActiveNav('divisions')}>
          <span className="nav-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </span>
          Divisions
        </div>

        <div className="nav-section-label">System</div>
        <div className={`nav-item ${activeNav === 'notifications' ? 'active' : ''}`} onClick={() => setActiveNav('notifications')}>
          <span className="nav-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            </svg>
          </span>
          Notifications
          {unreadCount > 0 && <span className="nav-badge red">{unreadCount}</span>}
        </div>
        <div className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`} onClick={() => setActiveNav('settings')}>
          <span className="nav-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </span>
          Settings
        </div>

        <div className="sidebar-footer">
          <div className="system-status">
            <div className="status-dot"></div>
            All systems nominal
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-faint)', marginTop: '6px', letterSpacing: '.06em' }}>
            v2.4.1 - Last sync 2 min ago
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main">
        {/* Alert Strip */}
        {analytics.pending > 0 && !alertDismissed && (
          <div className="alert-strip">
            <span className="alert-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </span>
            <span className="alert-text"><strong>{analytics.pending} visit requests</strong> have been pending for more than 24 hours - consider reassigning or escalating.</span>
            <span style={{ fontSize: '10px', color: 'var(--amber)', cursor: 'pointer', letterSpacing: '.06em' }} onClick={() => setActiveNav('appointments')}>VIEW ALL</span>
            <span className="alert-dismiss" onClick={() => setAlertDismissed(true)}>x</span>
          </div>
        )}

        {/* Page Header */}
        <div className="page-header">
          <div>
            <div className="page-title">Good morning, <em>Admin.</em></div>
            <div className="page-meta">{getDateLabel()} - Week {getWeekNumber()} - Q1</div>
          </div>
          <div className="page-actions">
            <button className="btn btn-ghost" onClick={exportAppointmentsReport}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export Report
            </button>
            <button className="btn btn-amber" onClick={openCreateStaff}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create Staff
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="kpi-strip">
          <div className="kpi-card" style={{ '--kpi-color': 'var(--amber)', '--kpi-fill': '0.72' }}>
            <div className="kpi-label">Total visit requests</div>
            <div className="kpi-value">{analytics.totalAppointments}</div>
            <div className="kpi-sub"><span className="kpi-trend-up">+ 12%</span> vs last month</div>
          </div>
          <div className="kpi-card" style={{ '--kpi-color': 'var(--red)', '--kpi-fill': '0.42' }}>
            <div className="kpi-label">Pending Review</div>
            <div className="kpi-value" style={{ color: 'var(--red)' }}>{analytics.pending}</div>
            <div className="kpi-sub"><span className="kpi-trend-dn">+ 3</span> since yesterday</div>
          </div>
          <div className="kpi-card" style={{ '--kpi-color': 'var(--green)', '--kpi-fill': '0.88' }}>
            <div className="kpi-label">Active Staff</div>
            <div className="kpi-value" style={{ color: 'var(--green)' }}>{analytics.activeStaff}</div>
            <div className="kpi-sub">{staff.length - analytics.activeStaff} inactive accounts</div>
          </div>
          <div className="kpi-card" style={{ '--kpi-color': 'var(--cyan)', '--kpi-fill': '0.61' }}>
            <div className="kpi-label">Avg Response Time</div>
            <div className="kpi-value" style={{ color: 'var(--cyan)' }}>{analytics.avgResponseTime}</div>
            <div className="kpi-sub"><span className="kpi-trend-up">- 18min</span> improvement</div>
          </div>
        </div>

        {/* Main Panels */}
        {activeNav === 'dashboard' && (
          <div className="two-col">
            {/* Appointments Panel */}
            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="panel-title-dot"></div>
                  Recent visit requests
                </div>
                <span className="panel-action" onClick={() => setActiveNav('appointments')}>View All</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Visitor</th>
                      <th>Staff</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAppointments.slice(0, 5).map((a) => (
                      <tr key={a.id}>
                        <td>
                          <div className="td-flex">
                            <div className="avatar-sm" style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: '#fff' }}>{getInitials(a.visitor_name)}</div>
                            <div>
                              <div className="td-name">{a.visitor_name}</div>
                              <div className="td-sub">{a.visitor_email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span style={{ color: 'var(--text-dim)' }}>{a.staff_name}</span></td>
                        <td><StatusBadge status={a.status} /></td>
                        <td>{new Date(a.appointment_date).toLocaleDateString('en-GB', { timeZone: EAT_TIMEZONE })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Staff Panel */}
            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="panel-title-dot" style={{ background: 'var(--cyan)' }}></div>
                  Staff Overview
                </div>
                <span className="panel-action" onClick={() => setActiveNav('staff')}>Manage All</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.slice(0, 4).map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="td-flex">
                            <div className="avatar-sm" style={{ background: s.role === 'Admin' ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'linear-gradient(135deg, #065f46, #10b981)', color: s.role === 'Admin' ? '#000' : '#fff' }}>
                              {getInitials(s.full_name)}
                            </div>
                            <div>
                              <div className="td-name">{s.full_name}</div>
                              <div className="td-sub">{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><Badge role={s.role} /></td>
                        <td><StatusBadge status={s.is_active ? 'Active' : 'Inactive'} /></td>
                        <td>
                          <div className="row-actions">
                            <button className="act-btn" onClick={() => openEditStaff(s)}>Edit</button>
                            <button className="act-btn" onClick={() => handleResetPassword(s.id)}>Reset</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Staff Management */}
        {activeNav === 'staff' && (
          <div className="panel full">
            <div className="panel-head">
              <div className="panel-title">
                <div className="panel-title-dot"></div>
                Staff Roster
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  className="field-input"
                  placeholder="Filter..."
                  style={{ padding: '5px 10px', width: '140px' }}
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                />
                <button className="btn btn-amber" style={{ padding: '6px 12px' }} onClick={openCreateStaff}>+ New</button>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="td-flex">
                          <div className="avatar-sm" style={{ background: s.role === 'Admin' ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'linear-gradient(135deg, #065f46, #10b981)', color: s.role === 'Admin' ? '#000' : '#fff' }}>
                            {getInitials(s.full_name)}
                          </div>
                          <div>
                            <div className="td-name">{s.full_name}</div>
                            <div className="td-sub">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ color: 'var(--text-dim)' }}>{s.department_name || 'N/A'}</span></td>
                      <td><Badge role={s.role} /></td>
                      <td><StatusBadge status={s.is_active ? 'Active' : 'Inactive'} /></td>
                      <td>
                        <div className="row-actions">
                          <button className="act-btn" onClick={() => openEditStaff(s)}>Edit</button>
                          <button className="act-btn" onClick={() => handleResetPassword(s.id)}>Reset</button>
                          <button className={`act-btn ${!s.is_active ? 'act-btn-active' : ''}`} onClick={() => toggleStaffActive(s)}>
                            {s.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="act-btn danger" onClick={() => openConfirm({
                            title: 'Delete Staff?',
                            message: 'Delete ' + s.full_name + ' permanently?',
                            confirmText: 'Delete',
                            tone: 'danger',
                            action: () => handleDeleteStaff(s.id)
                          })}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Visitor log */}
        {activeNav === 'appointments' && (
          <div className="panel full">
            <div className="panel-head">
              <div className="panel-title">
                <div className="panel-title-dot"></div>
                Visitor log
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  className="field-input"
                  placeholder="Search..."
                  style={{ padding: '5px 10px', width: '160px' }}
                  value={appointmentSearch}
                  onChange={(e) => setAppointmentSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Staff</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="td-flex">
                          <div className="avatar-sm" style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: '#fff' }}>{getInitials(a.visitor_name)}</div>
                          <div>
                            <div className="td-name">{a.visitor_name}</div>
                            <div className="td-sub">{a.visitor_email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ color: 'var(--text-dim)' }}>{a.staff_name}</span></td>
                      <td><span style={{ color: 'var(--text-dim)' }}>{a.department_name}</span></td>
                      <td>{new Date(a.appointment_date).toLocaleString('en-GB', { timeZone: EAT_TIMEZONE })}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>
                        <div className="row-actions">
                          <button className="act-btn" onClick={() => { setReassignModal(a); setReassignStaff(String(a.staff_member)); }}>Reassign</button>
                          <button className="act-btn danger" onClick={() => openConfirm({
                            title: 'Delete visit request?',
                            message: 'Delete visit request from ' + a.visitor_name + '?',
                            confirmText: 'Delete',
                            tone: 'danger',
                            action: () => handleDeleteAppointment(a.id)
                          })}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Departments */}
        {activeNav === 'departments' && (
          <div className="two-col">
            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="panel-title-dot"></div>
                  Add Department
                </div>
              </div>
              <div className="panel-body">
                <form onSubmit={createDepartment}>
                  <div className="field" style={{ marginBottom: '12px' }}>
                    <label className="field-label">Department Name *</label>
                    <input className="field-input" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="e.g., Engineering" required />
                  </div>
                  <button type="submit" className="btn btn-amber" style={{ width: '100%' }}>Create Department</button>
                </form>
              </div>
            </div>
            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="panel-title-dot"></div>
                  Departments List
                </div>
              </div>
              <div className="panel-body">
                {departments.map((d) => (
                  <div key={d.id} className="dept-card" style={{ '--dept-color': '#f59e0b', marginBottom: '8px' }}>
                    {editingDeptId === d.id ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input className="field-input" value={editingDeptName} onChange={(e) => setEditingDeptName(e.target.value)} style={{ flex: 1 }} />
                        <button className="btn btn-amber" onClick={saveDepartment}>Save</button>
                        <button className="btn btn-ghost" onClick={() => setEditingDeptId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="dept-name">{d.name}</div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="act-btn" onClick={() => { setEditingDeptId(d.id); setEditingDeptName(d.name); }}>Edit</button>
                            <button className="act-btn danger" onClick={() => openConfirm({
                              title: 'Delete Department?',
                              message: 'Delete "' + d.name + '"?',
                              confirmText: 'Delete',
                              tone: 'danger',
                              action: () => deleteDepartment(d.id)
                            })}>Del</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Divisions */}
        {activeNav === 'divisions' && (
          <div className="two-col">
            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="panel-title-dot"></div>
                  Add Division
                </div>
              </div>
              <div className="panel-body">
                <form onSubmit={createDivision}>
                  <div className="field" style={{ marginBottom: '12px' }}>
                    <label className="field-label">Division Name *</label>
                    <input className="field-input" value={newDivName} onChange={(e) => setNewDivName(e.target.value)} placeholder="e.g., Backend" required />
                  </div>
                  <div className="field" style={{ marginBottom: '12px' }}>
                    <label className="field-label">Department *</label>
                    <select className="field-input" value={newDivDept} onChange={(e) => setNewDivDept(e.target.value)} required>
                      <option value="">Select department...</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-amber" style={{ width: '100%' }}>Create Division</button>
                </form>
              </div>
            </div>
            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="panel-title-dot"></div>
                  Divisions List
                </div>
              </div>
              <div className="panel-body">
                {divisions.map((d) => (
                  <div key={d.id} className="dept-card" style={{ '--dept-color': '#22d3ee', marginBottom: '8px' }}>
                    {editingDivId === d.id ? (
                      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                        <input className="field-input" value={editingDivName} onChange={(e) => setEditingDivName(e.target.value)} placeholder="Division name" />
                        <select className="field-input" value={editingDivDept} onChange={(e) => setEditingDivDept(e.target.value)}>
                          {departments.map((dep) => (
                            <option key={dep.id} value={dep.id}>{dep.name}</option>
                          ))}
                        </select>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-amber" onClick={saveDivision}>Save</button>
                          <button className="btn btn-ghost" onClick={() => setEditingDivId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div className="dept-name">{d.name}</div>
                            <div className="dept-stats">{d.department_name}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="act-btn" onClick={() => { setEditingDivId(d.id); setEditingDivName(d.name); setEditingDivDept(String(d.department)); }}>Edit</button>
                            <button className="act-btn danger" onClick={() => openConfirm({
                              title: 'Delete Division?',
                              message: 'Delete "' + d.name + '"?',
                              confirmText: 'Delete',
                              tone: 'danger',
                              action: () => deleteDivision(d.id)
                            })}>Del</button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Page */}
        {activeNav === 'notifications' && (
          <>
            {/* Page header */}
            <div className="page-header">
              <div>
                <div className="page-title">Notification <em>Center</em></div>
                <div className="page-meta">{unreadCount} unread - Last updated {lastNotifUpdate.toLocaleTimeString('en-GB', { timeZone: EAT_TIMEZONE, hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-ghost" onClick={() => setActiveNav('settings')}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Preferences
                </button>
                <button className="btn btn-ghost" onClick={markAllRead}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Mark all read
                </button>
                <button className="btn btn-red" onClick={() => openConfirm({
                  title: 'Clear all notifications?',
                  message: 'This will remove all notifications from the list.',
                  confirmText: 'Clear all',
                  tone: 'danger',
                  action: clearNotifications,
                })}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Clear all
                </button>
              </div>
            </div>

            {/* Summary strip */}
            <div className="summary-strip">
              <div className="summary-card">
                <div className="summary-icon" style={{ background: '#ef444415', border: '1px solid var(--red-dim)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                </div>
                <div>
                  <div className="summary-label">Urgent</div>
                  <div className="summary-val" style={{ color: 'var(--red)' }}>{urgentCount}</div>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon" style={{ background: '#f59e0b15', border: '1px solid var(--amber-dim)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                <div>
                  <div className="summary-label">Unread</div>
                  <div className="summary-val" style={{ color: 'var(--amber)' }}>{unreadCount}</div>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon" style={{ background: '#22d3ee15', border: '1px solid var(--cyan-dim)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                </div>
                <div>
                  <div className="summary-label">Reports</div>
                  <div className="summary-val" style={{ color: 'var(--cyan)' }}>{notifications.filter(n => n.category === 'report').length}</div>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon" style={{ background: '#22c55e15', border: '1px solid var(--green-dim)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <div className="summary-label">Today Total</div>
                  <div className="summary-val" style={{ color: 'var(--green)' }}>{todayCount}</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs-row">
              <div className={`tab ${notifFilter === 'all' ? 'active' : ''}`} onClick={() => setNotifFilter('all')}>
                All <span className="tab-count">{notifications.length}</span>
              </div>
              <div className={`tab ${notifFilter === 'unread' ? 'active' : ''}`} onClick={() => setNotifFilter('unread')}>
                Unread <span className="tab-count">{unreadCount}</span>
              </div>
              <div className={`tab ${notifFilter === 'urgent' ? 'active' : ''}`} onClick={() => setNotifFilter('urgent')}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                Urgent <span className="tab-count">{urgentCount}</span>
              </div>
            </div>

            {/* Filter row */}
            <div className="filter-row">
              <div className={`filter-chip ${notifTypeFilter === 'all' ? 'active' : ''}`} onClick={() => setNotifTypeFilter('all')}>
                <div className="filter-dot" style={{ background: 'var(--text-dim)' }}></div>
                All types
              </div>
              <div className={`filter-chip ${notifTypeFilter === 'escalation' ? 'active' : ''}`} onClick={() => setNotifTypeFilter('escalation')}>
                <div className="filter-dot" style={{ background: 'var(--red)' }}></div>
                Escalation
              </div>
              <div className={`filter-chip ${notifTypeFilter === 'staff' ? 'active' : ''}`} onClick={() => setNotifTypeFilter('staff')}>
                <div className="filter-dot" style={{ background: 'var(--green)' }}></div>
                Staff
              </div>
              <div className={`filter-chip ${notifTypeFilter === 'appointments' ? 'active' : ''}`} onClick={() => setNotifTypeFilter('appointments')}>
                <div className="filter-dot" style={{ background: 'var(--amber)' }}></div>
                Visit requests
              </div>
              <div className={`filter-chip ${notifTypeFilter === 'security' ? 'active' : ''}`} onClick={() => setNotifTypeFilter('security')}>
                <div className="filter-dot" style={{ background: 'var(--purple)' }}></div>
                Security
              </div>
              <div className={`filter-chip ${notifTypeFilter === 'report' ? 'active' : ''}`} onClick={() => setNotifTypeFilter('report')}>
                <div className="filter-dot" style={{ background: 'var(--cyan)' }}></div>
                Reports
              </div>
              <div className="search-wrap">
                <input
                  className="search-input"
                  placeholder="Search notifications..."
                  value={notifSearch}
                  onChange={(e) => setNotifSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Notification list */}
            <div className="notif-list">
              {filteredNotifications.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </div>
                  <div className="empty-title">No notifications</div>
                  <div className="empty-sub">You're all caught up! Check back later for updates.</div>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const cat = NOTIF_CATEGORIES[notif.category] || NOTIF_CATEGORIES.appointments;
                  return (
                    <div key={notif.id} className={`notif-card ${notif.unread ? 'unread' : ''}`} style={{ '--notif-color': cat.color }}>
                      {notif.unread && <div className="notif-unread-dot"></div>}
                      <div className="notif-icon-wrap" style={{ background: cat.bg, border: '1px solid ' + cat.border }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="2">
                          <path d={cat.icon}></path>
                        </svg>
                      </div>
                      <div className="notif-body">
                        <div className="notif-header">
                          <div className="notif-category" style={{ background: cat.bg, color: cat.color, border: '1px solid ' + cat.border }}>
                            {notif.category.toUpperCase()}
                          </div>
                          <div className="notif-title">{notif.title}</div>
                        </div>
                        <div className="notif-message">
                          {notif.message}
                        </div>
                        <div className="notif-footer">
                          <span className="notif-time">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            {notif.time}
                          </span>
                          {notif.urgent && (
                            <div className="priority-tag" style={{ color: 'var(--red)' }}>
                              <span style={{ color: 'var(--red)' }}>&#9679;</span> High Priority
                            </div>
                          )}
                          <div className="notif-actions">
                            {notif.category === 'escalation' && (
                              <button className="notif-btn primary" style={{ '--notif-color': cat.color, color: '#fff' }} onClick={() => setActiveNav('appointments')}>Reassign</button>
                            )}
                            {notif.category === 'staff' && notif.staff.length > 0 && (
                              <button className="notif-btn primary" style={{ '--notif-color': cat.color, color: '#000' }} onClick={() => setActiveNav('staff')}>View profile</button>
                            )}
                            <button className="notif-btn dismiss" onClick={() => dismissNotification(notif.id)}>Dismiss</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Analytics */}
        {activeNav === 'analytics' && (
          <div className="panel full">
            <div className="panel-head">
              <div className="panel-title">
                <div className="panel-title-dot"></div>
                Analytics
              </div>
            </div>
            <div className="panel-body">
              <div style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
                Analytics views are coming soon. Use the export report button for now.
              </div>
            </div>
          </div>
        )}

        {/* Reports */}
        {activeNav === 'reports' && (
          <div className="panel full">
            <div className="panel-head">
              <div className="panel-title">
                <div className="panel-title-dot"></div>
                Reports
              </div>
            </div>
            <div className="panel-body">
              <div style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
                Reports dashboard is coming soon. Export current data from the dashboard.
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        {activeNav === 'settings' && (
          <div className="panel full">
            <div className="panel-head">
              <div className="panel-title">
                <div className="panel-title-dot"></div>
                Settings
              </div>
            </div>
            <div className="panel-body">
              <div style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
                Preferences will be available here. Notification settings currently use defaults.
              </div>
            </div>
          </div>
        )}

        {/* Quick Create Staff */}
        {activeNav === 'dashboard' && (
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">
                <div className="panel-title-dot" style={{ background: 'var(--amber)' }}></div>
                Quick Create Staff Account
              </div>
              <span style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '.08em' }}>ADMIN ONLY - staff cannot self-register</span>
            </div>
            <div className="panel-body">
              <div className="form-grid">
                <div className="field">
                  <label className="field-label">Full Name *</label>
                  <input className="field-input" placeholder="Jane Doe" value={staffForm.full_name} onChange={(e) => setStaffForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">Email Address *</label>
                  <input className="field-input" placeholder="jane@org.com" type="email" value={staffForm.email} onChange={(e) => setStaffForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">Phone Number</label>
                  <input
                    className="field-input"
                    placeholder="+254700000000"
                    type="tel"
                    value={staffForm.phone_number}
                    onChange={(e) => setStaffForm(f => ({ ...f, phone_number: e.target.value }))}
                  />
                  <div className="field-hint">Optional - include country code so Africa's Talking can deliver SMS.</div>
                </div>
                <div className="field">
                  <label className="field-label">Role *</label>
                  <select className="field-input" value={staffForm.role} onChange={(e) => setStaffForm(f => ({ ...f, role: e.target.value }))}>
                    <option>Staff</option>
                    <option>Admin</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Department *</label>
                  <select className="field-input" value={staffForm.department} onChange={(e) => setStaffForm(f => ({ ...f, department: e.target.value, division: '' }))}>
                    <option value="">Select department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Division *</label>
                  <select className="field-input" value={staffForm.division} onChange={(e) => setStaffForm(f => ({ ...f, division: e.target.value }))} disabled={!staffForm.department}>
                    <option value="">Select division...</option>
                    {divisions.filter(d => String(d.department) === String(staffForm.department)).map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <label className="field-label">Temp Password</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input 
                      className="field-input" 
                      style={{ flex: 1, minWidth: '200px', fontFamily: 'monospace', letterSpacing: '0.1em' }} 
                      value={staffForm.password} 
                      onChange={(e) => setStaffForm(f => ({ ...f, password: e.target.value }))} 
                      type={showPassword ? 'text' : 'password'} 
                    />
                    <button 
                      className="btn btn-ghost" 
                      style={{ padding: '8px', minWidth: '36px' }} 
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                    <button 
                      className="btn btn-ghost" 
                      style={{ padding: '8px', minWidth: '36px' }} 
                      onClick={() => setStaffForm(f => ({ ...f, password: generatePassword() }))}
                      title="Generate new password"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="field form-full" style={{ paddingTop: '4px' }}>
                  <button className="btn btn-amber" style={{ width: 'fit-content', padding: '10px 28px', fontSize: '12px' }} onClick={handleStaffSubmit}>
                    Create Staff Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border)', marginTop: '4px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-faint)', letterSpacing: '.1em' }}>GATEPASS CONTROL CENTER - v2.4.1</span>
          <span style={{ fontSize: '10px', color: 'var(--text-faint)', letterSpacing: '.08em' }}>2026 - All systems operational</span>
        </div>
      </main>

      {/* Create/Edit Staff Modal */}
      {showStaffModal && (
        <div className="modal-overlay" onClick={() => setShowStaffModal(false)}>
          <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <h3>{editingStaffId ? 'Edit Staff Member' : 'Create New Staff Account'}</h3>
            <p className="modal-subtitle">
              {editingStaffId ? 'Update staff details below.' : 'A welcome email with credentials will be sent to the staff member.'}
            </p>

            <div className="form-grid">
              <div className="field">
                <label className="field-label">Full Name *</label>
                <input className="field-input" value={staffForm.full_name} onChange={(e) => setStaffForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Jane Doe" />
              </div>
              <div className="field">
                <label className="field-label">Email Address *</label>
                <input className="field-input" value={staffForm.email} onChange={(e) => setStaffForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@org.com" type="email" disabled={!!editingStaffId} />
              </div>
              <div className="field">
                <label className="field-label">Phone Number</label>
                <input
                  className="field-input"
                  value={staffForm.phone_number}
                  onChange={(e) => setStaffForm(f => ({ ...f, phone_number: e.target.value }))}
                  placeholder="+254700000000"
                  type="tel"
                />
                <div className="field-hint">Optional - include country code so Africa's Talking can deliver SMS.</div>
              </div>
              <div className="field">
                <label className="field-label">Role *</label>
                <select className="field-input" value={staffForm.role} onChange={(e) => setStaffForm(f => ({ ...f, role: e.target.value }))}>
                  <option>Staff</option>
                  <option>Admin</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label">Department *</label>
                <select className="field-input" value={staffForm.department} onChange={(e) => setStaffForm(f => ({ ...f, department: e.target.value, division: '' }))}>
                  <option value="">Select department...</option>
                  {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Division *</label>
                <select className="field-input" value={staffForm.division} onChange={(e) => setStaffForm(f => ({ ...f, division: e.target.value }))} disabled={!staffForm.department}>
                  <option value="">Select division...</option>
                  {divisions.filter(d => String(d.department) === String(staffForm.department)).map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
              </div>
              {!editingStaffId && (
                <div className="field">
                  <label className="field-label">Temporary Password</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input 
                      className="field-input" 
                      style={{ flex: 1, minWidth: '200px', fontFamily: 'monospace', letterSpacing: '0.1em' }} 
                      value={staffForm.password} 
                      onChange={(e) => setStaffForm(f => ({ ...f, password: e.target.value }))} 
                      type={showPassword ? 'text' : 'password'} 
                    />
                    <button 
                      className="btn btn-ghost" 
                      style={{ padding: '8px', minWidth: '36px' }} 
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                    <button 
                      className="btn btn-ghost" 
                      style={{ padding: '8px', minWidth: '36px' }} 
                      onClick={() => setStaffForm(f => ({ ...f, password: generatePassword() }))}
                      title="Generate new password"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowStaffModal(false)}>Cancel</button>
              <button type="button" className="btn btn-amber" onClick={handleStaffSubmit} disabled={isLoadingStaff}>
                {isLoadingStaff ? 'Saving...' : editingStaffId ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Visit */}
      {reassignModal && (
        <div className="modal-overlay" onClick={() => setReassignModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Reassign visit request</h3>
            <p className="modal-subtitle">Transfer this visit request from {reassignModal.staff_name} to another staff member.</p>
            <div className="field" style={{ marginBottom: '16px' }}>
              <label className="field-label">Select New Staff Member *</label>
              <select className="field-input" value={reassignStaff} onChange={(e) => setReassignStaff(e.target.value)}>
                <option value="">Select staff...</option>
                {staff.filter(s => s.is_active).map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name} - {s.department_name}/{s.division_name}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setReassignModal(null)}>Cancel</button>
              <button type="button" className="btn btn-amber" onClick={handleReassign} disabled={!reassignStaff}>Reassign</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        tone={confirmDialog.tone}
        onConfirm={runConfirmAction}
        onCancel={closeConfirm}
      />
    </div>
  );
}
