import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useAppointments } from '../context/AppointmentContext';
import { sendAppointmentRequestEmail } from '../services/emailjs';

export default function HomePage() {
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [staff, setStaff] = useState([]);
  const { createAppointment } = useAppointments();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    visitor_name: '',
    visitor_email: '',
    department: '',
    division: '',
    staff_member: '',
    appointment_date: '',
    message: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessView, setIsSuccessView] = useState(false);
  const [inputTouched, setInputTouched] = useState(false);
  const [isStartingBooking, setIsStartingBooking] = useState(false);
  const activeDepartmentRef = useRef('');
  const activeDivisionRef = useRef('');

  const totalSteps = 7;
  const progressPercent = ((step + 1) / totalSteps) * 100;

  useEffect(() => {
    api.get('/departments/').then(({ data }) => setDepartments(data));
  }, []);

  useEffect(() => {
    document.body.classList.add('home-background');
    return () => {
      document.body.classList.remove('home-background');
    };
  }, []);

  useEffect(() => {
    if (!form.department) {
      setDivisions([]);
      setForm((prev) => ({ ...prev, division: '', staff_member: '' }));
      activeDepartmentRef.current = '';
      return;
    }
    activeDepartmentRef.current = String(form.department);
    api
      .get(`/divisions/?department_id=${form.department}`)
      .then(({ data }) => {
        if (activeDepartmentRef.current !== String(form.department)) return;
        setDivisions(data);
      })
      .catch(() => {});
  }, [form.department]);

  useEffect(() => {
    if (!form.department || !form.division) {
      setStaff([]);
      activeDivisionRef.current = '';
      return;
    }
    activeDivisionRef.current = String(form.division);
    api
      .get(`/staff/?department_id=${form.department}&division_id=${form.division}`)
      .then(({ data }) => {
        if (activeDivisionRef.current !== String(form.division)) return;
        setStaff(data);
      })
      .catch(() => {});
  }, [form.department, form.division]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === 'department') {
      setForm((prev) => ({ ...prev, department: value, division: '', staff_member: '' }));
      return;
    }
    if (name === 'division') {
      setForm((prev) => ({ ...prev, division: value, staff_member: '' }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitRequest = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    const nowIsoMinute = new Date().toISOString().slice(0, 16);
    if (form.appointment_date < nowIsoMinute) {
      setError('Please choose a future appointment date and time.');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...form,
        department: Number(form.department),
        division: Number(form.division),
        staff_member: Number(form.staff_member),
      };
      await createAppointment(payload);

      const selectedStaff = staff.find((member) => String(member.id) === String(form.staff_member));
      const selectedDepartment = departments.find((dep) => String(dep.id) === String(form.department));
      const selectedDivision = divisions.find((div) => String(div.id) === String(form.division));

      if (selectedStaff?.email) {
        const emailResult = await sendAppointmentRequestEmail({
          to_email: selectedStaff.email,
          to_name: selectedStaff.full_name,
          visitor_name: form.visitor_name,
          visitor_email: form.visitor_email,
          department_name: selectedDepartment?.name || '',
          division_name: selectedDivision?.name || '',
          appointment_date: form.appointment_date,
          message: form.message || '',
          staff_name: selectedStaff.full_name,
        });
        if (emailResult?.sent) {
          setSuccess('Thanks for submitting your appointment request. Wait a moment as the member responds. Check your email for response.');
          setIsSuccessView(true);
        } else {
          setError(`Appointment saved, but request email failed: ${emailResult?.error || 'EmailJS error'}`);
        }
      } else {
        setSuccess('Thanks for submitting your appointment request. Wait a moment as the member responds. Check your email for response.');
        setIsSuccessView(true);
      }

      setForm({
        visitor_name: '',
        visitor_email: '',
        department: '',
        division: '',
        staff_member: '',
        appointment_date: '',
        message: '',
      });
    } catch (err) {
      const data = err?.response?.data;
      let msg = data?.detail;
      if (!msg && data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const firstVal = firstKey ? data[firstKey] : null;
        msg = Array.isArray(firstVal) ? firstVal[0] : firstVal;
      }
      msg = msg || 'Unable to submit appointment request.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepMeta = () => {
    switch (step) {
      case 0:
        return {
          question: "What's your name?",
          field: (
            <input
              id="visitor_name"
              name="visitor_name"
              placeholder="Type your full name"
              value={form.visitor_name}
              onChange={onChange}
              autoFocus
              required
            />
          ),
          valid: Boolean(form.visitor_name.trim()),
        };
      case 1:
        return {
          question: "What's your email address?",
          field: (
            <input
              id="visitor_email"
              name="visitor_email"
              type="email"
              placeholder="you@example.com"
              value={form.visitor_email}
              onChange={onChange}
              autoComplete="email"
              autoFocus
              required
            />
          ),
          valid: Boolean(form.visitor_email.trim() && /\S+@\S+\.\S+/.test(form.visitor_email)),
        };
      case 2:
        return {
          question: 'Which department do you want to visit?',
          field: (
            <select id="department" name="department" value={form.department} onChange={onChange} autoFocus required>
              <option value="">Select Department</option>
              {departments.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.name}
                </option>
              ))}
            </select>
          ),
          valid: Boolean(form.department),
        };
      case 3:
        return {
          question: 'Choose a division in that department.',
          field: (
            <select
              id="division"
              name="division"
              value={form.division}
              onChange={onChange}
              disabled={!form.department}
              autoFocus
              required
            >
              <option value="">Select Division</option>
              {divisions.map((div) => (
                <option key={div.id} value={div.id}>
                  {div.name}
                </option>
              ))}
            </select>
          ),
          valid: Boolean(form.division),
        };
      case 4:
        return {
          question: 'Select the staff member you want to meet.',
          field: (
            <select
              id="staff_member"
              name="staff_member"
              value={form.staff_member}
              onChange={onChange}
              disabled={!form.division}
              autoFocus
              required
            >
              <option value="">Select Staff</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
          ),
          valid: Boolean(form.staff_member),
        };
      case 5:
        return {
          question: 'When should the appointment happen?',
          field: (
            <input
              id="appointment_date"
              name="appointment_date"
              type="datetime-local"
              value={form.appointment_date}
              onChange={onChange}
              autoFocus
              required
            />
          ),
          valid: Boolean(form.appointment_date),
        };
      default:
        return {
          question: 'Any note for the staff member? (Optional)',
          field: (
            <textarea
              id="message"
              name="message"
              placeholder="Write your message"
              value={form.message}
              onChange={onChange}
              rows={4}
              autoFocus
            />
          ),
          valid: true,
        };
    }
  };

  const stepMeta = getStepMeta();

  const onNext = async () => {
    setInputTouched(true);
    if (!stepMeta.valid) return;
    setInputTouched(false);
    if (step === totalSteps - 1) {
      await submitRequest();
      return;
    }
    setStep((prev) => prev + 1);
  };

  const onBack = () => {
    setError('');
    setInputTouched(false);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  if (isSuccessView) {
    return (
      <div className="container">
        <div className="success-shell">
          <div className="success-icon" aria-hidden="true">
            <svg viewBox="0 0 52 52">
              <circle className="success-circle" cx="26" cy="26" r="24" />
              <path className="success-check" d="M14 27l8 8 16-18" />
            </svg>
          </div>
          <h2>Request Submitted</h2>
          <p>{success}</p>
          <button type="button" onClick={() => setIsSuccessView(false)}>Submit Another Request</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="hero">
        <h1>Welcome to Smart Appointments</h1>
      </div>
      <p className="page-subtitle">
        Tell us what you need in a few quick steps. We will route your request to the right team member.
      </p>
      <section className="home-intro-grid">
        <article className="card intro-card">
          <h3 className="section-title">Why book with us?</h3>
          <p className="dialog-copy">
            We designed the experience to be fast, transparent, and simple. Choose your department, pick a staff member,
            and receive email updates as your request is processed.
          </p>
          <div className="feature-list">
            <span className="feature-pill">Instant Request Delivery</span>
            <span className="feature-pill">Email Response Updates</span>
            <span className="feature-pill">Department + Division Routing</span>
          </div>
        </article>
        <article className="card intro-card">
          <h3 className="section-title">How it works</h3>
          <ol className="flow-list">
            <li>Answer a few guided questions about your request.</li>
            <li>We forward your appointment to the selected staff member.</li>
            <li>Staff responds, and you receive the update via email.</li>
          </ol>
        </article>
      </section>

      {!started ? (
        <section className="card dialog-card">
          <h3 className="section-title">Ready to book your appointment?</h3>
          <p className="dialog-copy">
            This takes less than one minute. You will answer a few short questions and we will submit your booking instantly.
          </p>
          <button
            type="button"
            className={`dialog-start-btn ${isStartingBooking ? 'is-clicked' : ''}`}
            onClick={() => {
              setIsStartingBooking(true);
              setTimeout(() => {
                setStarted(true);
                setIsStartingBooking(false);
              }, 260);
            }}
          >
            Confirm Booking
          </button>
        </section>
      ) : (
        <section className="card dialog-card">
          <div className="progress-wrap">
            <div className="progress-label-row">
              <span>Booking Progress</span>
              <span>{step + 1}/{totalSteps}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="question-shell">
            <p className="question-title">{stepMeta.question}</p>
            <div className="field-group full">{stepMeta.field}</div>
            {inputTouched && !stepMeta.valid && (
              <p className="error">Please provide a valid answer to continue.</p>
            )}
            <div className="dialog-actions">
              <button type="button" className="btn-muted" onClick={onBack} disabled={step === 0 || isSubmitting}>
                Back
              </button>
              <button type="button" onClick={onNext} disabled={isSubmitting}>
                {step === totalSteps - 1
                  ? isSubmitting
                    ? 'Submitting your request...'
                    : 'Submit Request'
                  : 'Next'}
              </button>
            </div>
          </div>
        </section>
      )}
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
}
