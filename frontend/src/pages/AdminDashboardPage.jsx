import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [departmentName, setDepartmentName] = useState('');
  const [divisionName, setDivisionName] = useState('');
  const [divisionDepartment, setDivisionDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [staff, setStaff] = useState([]);
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [editingDepartmentName, setEditingDepartmentName] = useState('');
  const [editingDivisionId, setEditingDivisionId] = useState(null);
  const [editingDivisionName, setEditingDivisionName] = useState('');
  const [editingDivisionDepartment, setEditingDivisionDepartment] = useState('');
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editingStaff, setEditingStaff] = useState({
    full_name: '',
    role: 'Staff',
    department: '',
    division: '',
    is_active: true,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    tone: 'default',
    action: null,
  });

  const loadData = useCallback(async () => {
    const [depRes, divRes, staffRes] = await Promise.all([
      api.get('/departments/'),
      api.get('/divisions/'),
      api.get('/staff/?include_inactive=1'),
    ]);
    setDepartments(depRes.data);
    setDivisions(divRes.data);
    setStaff(staffRes.data);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadData().catch(() => {});
    }, 10000);
    return () => clearInterval(intervalId);
  }, [loadData]);

  useEffect(() => {
    document.body.classList.add('dashboard-background');
    return () => {
      document.body.classList.remove('dashboard-background');
    };
  }, []);

  const createDepartment = async (e) => {
    e.preventDefault();
    await api.post('/departments/', { name: departmentName });
    setDepartmentName('');
    await loadData();
  };

  const createDivision = async (e) => {
    e.preventDefault();
    await api.post('/divisions/', { name: divisionName, department: divisionDepartment });
    setDivisionName('');
    setDivisionDepartment('');
    await loadData();
  };

  const startEditDepartment = (department) => {
    setEditingDepartmentId(department.id);
    setEditingDepartmentName(department.name);
  };

  const saveDepartment = async () => {
    if (!editingDepartmentId) return;
    await api.patch(`/departments/${editingDepartmentId}/`, { name: editingDepartmentName });
    setEditingDepartmentId(null);
    setEditingDepartmentName('');
    await loadData();
  };

  const deleteDepartment = async (id) => {
    await api.delete(`/departments/${id}/`);
    await loadData();
  };

  const startEditDivision = (division) => {
    setEditingDivisionId(division.id);
    setEditingDivisionName(division.name);
    setEditingDivisionDepartment(String(division.department));
  };

  const saveDivision = async () => {
    if (!editingDivisionId) return;
    await api.patch(`/divisions/${editingDivisionId}/`, {
      name: editingDivisionName,
      department: editingDivisionDepartment,
    });
    setEditingDivisionId(null);
    setEditingDivisionName('');
    setEditingDivisionDepartment('');
    await loadData();
  };

  const deleteDivision = async (id) => {
    await api.delete(`/divisions/${id}/`);
    await loadData();
  };

  const startEditStaff = (member) => {
    setEditingStaffId(member.id);
    setEditingStaff({
      full_name: member.full_name,
      role: member.role,
      department: String(member.department || ''),
      division: String(member.division || ''),
      is_active: Boolean(member.is_active),
    });
  };

  const saveStaff = async () => {
    if (!editingStaffId) return;
    await api.patch(`/staff/${editingStaffId}/`, {
      full_name: editingStaff.full_name,
      role: editingStaff.role,
      department: editingStaff.department || null,
      division: editingStaff.division || null,
      is_active: editingStaff.is_active,
    });
    setEditingStaffId(null);
    await loadData();
  };

  const deleteStaff = async (id) => {
    await api.delete(`/staff/${id}/`);
    await loadData();
  };

  const deactivateStaff = async (id) => {
    await api.patch(`/staff/${id}/deactivate/`);
    await loadData();
  };

  const toggleStaffActive = async (member) => {
    await api.patch(`/staff/${member.id}/`, { is_active: !member.is_active });
    await loadData();
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
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      confirmText: 'Confirm',
      tone: 'default',
      action: null,
    });
  };

  const runConfirmAction = async () => {
    const action = confirmDialog.action;
    closeConfirm();
    if (action) {
      await action();
    }
  };

  const handleLogout = () => {
    sessionStorage.setItem('app_toast', 'Logged out successfully.');
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="container">
      <div className="header-row">
        <h1>Admin Dashboard</h1>
        <button className="logout-icon-btn" onClick={handleLogout} aria-label="Logout" title="Logout">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-8" />
            <path d="M14 12H3" />
            <path d="m7 8-4 4 4 4" />
          </svg>
        </button>
      </div>
      <p className="page-subtitle">Manage departments, divisions, and staff accounts from one control surface.</p>

      <form className="card" onSubmit={createDepartment}>
        <h3>Add Department</h3>
        <input value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} required />
        <button type="submit">Add</button>
      </form>

      <form className="card" onSubmit={createDivision}>
        <h3>Add Division</h3>
        <input value={divisionName} onChange={(e) => setDivisionName(e.target.value)} placeholder="Division name" required />
        <select value={divisionDepartment} onChange={(e) => setDivisionDepartment(e.target.value)} required>
          <option value="">Select Department</option>
          {departments.map((dep) => (
            <option key={dep.id} value={dep.id}>
              {dep.name}
            </option>
          ))}
        </select>
        <button type="submit">Add</button>
      </form>

      <div className="card">
        <h3>Departments</h3>
        <ul>
          {departments.map((d) => (
            <li key={d.id}>
              {editingDepartmentId === d.id ? (
                <>
                  <input value={editingDepartmentName} onChange={(e) => setEditingDepartmentName(e.target.value)} />
                  <button type="button" onClick={saveDepartment}>Save</button>
                  <button type="button" onClick={() => setEditingDepartmentId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  {d.name}
                  <button type="button" onClick={() => startEditDepartment(d)}>Edit</button>
                  <button
                    type="button"
                    onClick={() =>
                      openConfirm({
                        title: 'Delete Department?',
                        message: `Delete "${d.name}" and related references where applicable?`,
                        confirmText: 'Delete',
                        tone: 'danger',
                        action: async () => deleteDepartment(d.id),
                      })
                    }
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Divisions</h3>
        <ul>
          {divisions.map((d) => (
            <li key={d.id}>
              {editingDivisionId === d.id ? (
                <>
                  <input value={editingDivisionName} onChange={(e) => setEditingDivisionName(e.target.value)} />
                  <select
                    value={editingDivisionDepartment}
                    onChange={(e) => setEditingDivisionDepartment(e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dep) => (
                      <option key={dep.id} value={dep.id}>
                        {dep.name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={saveDivision}>Save</button>
                  <button type="button" onClick={() => setEditingDivisionId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  {d.name} - {d.department_name}
                  <button type="button" onClick={() => startEditDivision(d)}>Edit</button>
                  <button
                    type="button"
                    onClick={() =>
                      openConfirm({
                        title: 'Delete Division?',
                        message: `Delete "${d.name}" from "${d.department_name}"?`,
                        confirmText: 'Delete',
                        tone: 'danger',
                        action: async () => deleteDivision(d.id),
                      })
                    }
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Staff</h3>
        <ul>
          {staff.map((s) => (
            <li key={s.id}>
              {editingStaffId === s.id ? (
                <>
                  <input
                    value={editingStaff.full_name}
                    onChange={(e) => setEditingStaff((prev) => ({ ...prev, full_name: e.target.value }))}
                  />
                  <select
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff((prev) => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <select
                    value={editingStaff.department}
                    onChange={(e) =>
                      setEditingStaff((prev) => ({ ...prev, department: e.target.value, division: '' }))
                    }
                  >
                    <option value="">Select Department</option>
                    {departments.map((dep) => (
                      <option key={dep.id} value={dep.id}>
                        {dep.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editingStaff.division}
                    onChange={(e) => setEditingStaff((prev) => ({ ...prev, division: e.target.value }))}
                    disabled={!editingStaff.department}
                  >
                    <option value="">Select Division</option>
                    {divisions
                      .filter((div) => String(div.department) === String(editingStaff.department))
                      .map((div) => (
                        <option key={div.id} value={div.id}>
                          {div.name}
                        </option>
                      ))}
                  </select>
                  <button type="button" onClick={saveStaff}>Save</button>
                  <button type="button" onClick={() => setEditingStaffId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  {s.full_name} - {s.email} ({s.department_name || 'No Department'} / {s.division_name || 'No Division'}) [{s.is_active ? 'Active' : 'Inactive'}]
                  <button type="button" onClick={() => startEditStaff(s)}>Edit</button>
                  {s.is_active ? (
                    <button
                      type="button"
                      onClick={() =>
                        openConfirm({
                          title: 'Deactivate Staff?',
                          message: `Deactivate "${s.full_name}"? They will not be able to log in.`,
                          confirmText: 'Deactivate',
                          tone: 'danger',
                          action: async () => deactivateStaff(s.id),
                        })
                      }
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        openConfirm({
                          title: 'Activate Staff?',
                          message: `Activate "${s.full_name}" account?`,
                          confirmText: 'Activate',
                          tone: 'default',
                          action: async () => toggleStaffActive(s),
                        })
                      }
                    >
                      Activate
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      openConfirm({
                        title: 'Delete Staff Account?',
                        message: `Delete "${s.full_name}" permanently? This cannot be undone.`,
                        confirmText: 'Delete',
                        tone: 'danger',
                        action: async () => deleteStaff(s.id),
                      })
                    }
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
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
