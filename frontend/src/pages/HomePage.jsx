import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { sendAppointmentRequestEmail } from '../services/emailjs';

const ICONS = {
  calendar: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="16" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" strokeWidth="2" />
      <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" strokeWidth="2" />
      <line x1="4" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  monitor: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="11" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2" />
      <line x1="12" y1="16" x2="12" y2="21" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  clipboard: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 3h6a2 2 0 0 1 2 2v2H7V5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="7" y="7" width="10" height="14" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 2L3 14h7l-1 8 12-14h-7l-1-6z" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <polyline points="3,7 12,13 21,7" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M10 21a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  alertCircle: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="12" y1="7" x2="12" y2="13" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="16.5" r="0.75" fill="currentColor" />
    </svg>
  ),
  building: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 21V7l7-4 7 4v14" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="3" y1="21" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
      <line x1="9" y1="9" x2="9" y2="11" stroke="currentColor" strokeWidth="2" />
      <line x1="15" y1="9" x2="15" y2="11" stroke="currentColor" strokeWidth="2" />
      <line x1="9" y1="13" x2="9" y2="15" stroke="currentColor" strokeWidth="2" />
      <line x1="15" y1="13" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="5,13 9,17 19,7" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  checkCircle: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <polyline points="8,12 11,15 16,9" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  hourglass: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="6" y1="2" x2="18" y2="2" stroke="currentColor" strokeWidth="2" />
      <line x1="6" y1="22" x2="18" y2="22" stroke="currentColor" strokeWidth="2" />
      <path d="M6 2c0 6 6 6 6 10s-6 4-6 10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M18 2c0 6-6 6-6 10s6 4 6 10" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="3,6 9,4 15,6 21,4 21,18 15,20 9,18 3,20" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="9" y1="4" x2="9" y2="18" stroke="currentColor" strokeWidth="2" />
      <line x1="15" y1="6" x2="15" y2="20" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22 16.92V21a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 11.2 19.9a19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1 4.18 2 2 0 0 1 3 2h4.09a2 2 0 0 1 2 1.72 12.3 12.3 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.3 12.3 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  ),
  wrench: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-3 3-2-2 3-3z" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  cash: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="6" y1="10" x2="6" y2="14" stroke="currentColor" strokeWidth="2" />
      <line x1="18" y1="10" x2="18" y2="14" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a7.6 7.6 0 0 0 .1-2l2-1.1-2-3.4-2.2.4a7.6 7.6 0 0 0-1.7-1L13 2h-2l-.6 3a7.6 7.6 0 0 0-1.7 1l-2.2-.4-2 3.4 2 1.1a7.6 7.6 0 0 0 0 2l-2 1.1 2 3.4 2.2-.4a7.6 7.6 0 0 0 1.7 1l.6 3h2l.6-3a7.6 7.6 0 0 0 1.7-1l2.2.4 2-3.4-2-1.1z" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  scales: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="2" />
      <line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="2" />
      <path d="M4 7l-3 6h6l-3-6z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M20 7l-3 6h6l-3-6z" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" />
      <polyline points="13,6 19,12 13,18" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
};

const HERO_TYPEWRITER_LINES = [
  { text: 'Let your host know', variant: 'plain' },
  { text: "you're here.", variant: 'emphasized' },
  { text: 'We will handle the rest.', variant: 'line2' },
];

export default function HomePage() {
  const EAT_TIMEZONE = 'Africa/Nairobi';
  const STAFF_UNAVAILABLE_STORAGE_KEY = 'staff_unavailable_by_date';
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [staff, setStaff] = useState([]);
  const [activeDeptId, setActiveDeptId] = useState(null);
  const [activeDivisionId, setActiveDivisionId] = useState('all');
  const [deptSearchTerm, setDeptSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [drawerDivisions, setDrawerDivisions] = useState([]);
  const [prefillSelection, setPrefillSelection] = useState(null);
  const [toast, setToast] = useState('');
  const [unavailableByDate, setUnavailableByDate] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [featureCarouselIndex, setFeatureCarouselIndex] = useState(0);
  const [isReceptionistMode, setIsReceptionistMode] = useState(true);
  const [homeNavOpen, setHomeNavOpen] = useState(false);
  const [formData, setFormData] = useState({
    visitor_name: '',
    visitor_email: '',
    phone: '',
    department: '',
    division: '',
    staff_member: '',
    appointment_date: '',
    message: '',
  });
  const [validation, setValidation] = useState({
    nameValid: false,
    emailValid: false,
    emailError: false,
    dateValid: false,
    dateError: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 7;
  const [typedLines, setTypedLines] = useState(HERO_TYPEWRITER_LINES.map(() => ''));
  const [typingLine, setTypingLine] = useState(0);
  const [typewriterDone, setTypewriterDone] = useState(false);
  const getInitialMobileView = () => (typeof window !== 'undefined' ? window.innerWidth <= 900 : false);
  const [isMobileView, setIsMobileView] = useState(getInitialMobileView);
  const [isHeroFormVisible, setIsHeroFormVisible] = useState(() => !getInitialMobileView());
  const heroRef = useRef(null);

  useEffect(() => {
    document.body.classList.add('home-background');
    return () => {
      document.body.classList.remove('home-background');
    };
  }, []);

  useEffect(() => {
    const timers = [];
    const buffer = HERO_TYPEWRITER_LINES.map(() => '');
    let lineIndex = 0;
    let charIndex = 0;

    const finishTyping = () => {
      setTypewriterDone(true);
      setTypingLine(HERO_TYPEWRITER_LINES.length - 1);
    };

    const typeStep = () => {
      if (lineIndex >= HERO_TYPEWRITER_LINES.length) {
        finishTyping();
        return;
      }

      setTypingLine(lineIndex);
      const target = HERO_TYPEWRITER_LINES[lineIndex].text;
      if (charIndex < target.length) {
        charIndex += 1;
        buffer[lineIndex] = target.slice(0, charIndex);
        setTypedLines([...buffer]);
        timers.push(setTimeout(typeStep, 65));
      } else {
        lineIndex += 1;
        charIndex = 0;
        if (lineIndex < HERO_TYPEWRITER_LINES.length) {
          timers.push(setTimeout(typeStep, 420));
        } else {
          timers.push(setTimeout(finishTyping, 240));
        }
      }
    };

    timers.push(setTimeout(typeStep, 450));
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  useEffect(() => {
    api.get('/departments/').then(({ data }) => setDepartments(data)).catch(console.error);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadStaff = async () => {
      try {
        const { data } = await api.get('/staff/?include=active');
        if (isMounted) setAllStaff((data || []).map(normalizeStaff));
      } catch (error) {
        try {
          const { data } = await api.get('/staff/');
          if (isMounted) setAllStaff((data || []).map(normalizeStaff));
        } catch (innerError) {
          console.error(innerError);
        }
      }
    };
    loadStaff();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      const mobile = window.innerWidth <= 900;
      setIsMobileView(mobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsHeroFormVisible(!isMobileView);
  }, [isMobileView]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STAFF_UNAVAILABLE_STORAGE_KEY);
      setUnavailableByDate(raw ? JSON.parse(raw) : {});
    } catch {
      setUnavailableByDate({});
    }
    const onStorage = (e) => {
      if (e.key === STAFF_UNAVAILABLE_STORAGE_KEY) {
        try {
          setUnavailableByDate(e.newValue ? JSON.parse(e.newValue) : {});
        } catch {
          setUnavailableByDate({});
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const scrollToHero = () => {
    heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const revealMobileHeroForm = () => {
    setIsHeroFormVisible(true);
    scrollToHero();
  };

  const hideMobileHeroForm = () => {
    setIsHeroFormVisible(false);
    scrollToHero();
  };

  useEffect(() => {
    if (formData.department) {
      api.get(`/divisions/?department_id=${formData.department}`).then(({ data }) => setDivisions(data)).catch(console.error);
    } else {
      setDivisions([]);
    }
  }, [formData.department]);

  useEffect(() => {
    if (!formData.division) {
      setStaff([]);
      return;
    }
    const divisionId = parseInt(formData.division, 10);
    setStaff(allStaff.filter(s => getDivisionId(s) === divisionId));
  }, [formData.division, allStaff]);

  const showToastMessage = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3500);
  };

  const getEATDateKey = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-CA', { timeZone: EAT_TIMEZONE });

  const isStaffUnavailableOnDate = (staffId, dateStr) => {
    if (!staffId || !dateStr) return false;
    const key = getEATDateKey(dateStr);
    const dates = unavailableByDate[String(staffId)] || [];
    return dates.includes(key);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'appointment_date' && prev.staff_member && isStaffUnavailableOnDate(prev.staff_member, value)) {
        next.staff_member = '';
      }
      return next;
    });

    if (['department', 'division', 'staff_member'].includes(field)) {
      setPrefillSelection(null);
    }
    
    if (field === 'visitor_name') {
      setValidation(prev => ({ ...prev, nameValid: value.length > 2 }));
    }
    if (field === 'visitor_email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setValidation(prev => ({ 
        ...prev, 
        emailValid: emailRegex.test(value),
        emailError: value.length > 3 && !emailRegex.test(value)
      }));
    }
    if (field === 'appointment_date') {
      const selected = new Date(value);
      // Use EAT timezone for validation
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: EAT_TIMEZONE }));
      const eatNow = new Date(now.getTime() + 3 * 60 * 60 * 1000); // UTC+3 for EAT
      
      // Check if selected time is within office hours (8 AM - 5 PM EAT)
      const selectedHours = selected.getHours();
      const isOfficeHours = selectedHours >= 8 && selectedHours < 17;
      
      if (formData.staff_member && isStaffUnavailableOnDate(formData.staff_member, value)) {
        showToastMessage('This staff member is unavailable on that date. Please choose another date.');
      }
      setValidation(prev => ({ 
        ...prev, 
        dateValid: selected > now && isOfficeHours,
        dateError: (selected <= now || !isOfficeHours) && value.length > 0
      }));
    }
  };

  const goToStep = (step) => {
    if (step < 1 || step > totalSteps) return;
    
    if (step > currentStep) {
      if (currentStep === 1 && !validation.nameValid) return;
      if (currentStep === 2 && !validation.emailValid) return;
      if (currentStep === 6 && (!formData.appointment_date || !validation.dateValid || isNextDaySelection(formData.appointment_date))) return;
    }
    
    setCurrentStep(step);
  };

  const submitBooking = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const chosenStaff = allStaff.find((s) => String(s.id) === String(formData.staff_member));
    if (chosenStaff?.is_available === false) {
      const hostName = chosenStaff.full_name || chosenStaff.first_name || 'This host';
      const reason = (chosenStaff.availability_reason || '').trim();
      showToastMessage(
        reason
          ? `You can't alert ${hostName} right now: ${reason}`
          : `You can't alert ${hostName} right now because they are unavailable.`
      );
      setIsSubmitting(false);
      return;
    }
    try {
      const payload = {
        visitor_name: formData.visitor_name,
        visitor_email: formData.visitor_email,
        visitor_phone: formData.phone || '',
        department: formData.department,
        division: formData.division,
        staff_member: formData.staff_member,
        appointment_date: formData.appointment_date,
        message: formData.message || '',
      };
      
      const { data } = await api.post('/appointments/create/', payload);
      
      // Send email notification to staff member via EmailJS
      const selectedStaff = allStaff.find(s => String(s.id) === String(formData.staff_member));
      if (selectedStaff?.email) {
        const deptName = selectedStaff.department?.name || getDeptNameFromId(selectedStaff.department) || '';
        const divName = selectedStaff.division?.name || selectedStaff.division_name || '';
        
        try {
          await sendAppointmentRequestEmail({
            to_email: selectedStaff.email,
            to_name: selectedStaff.full_name || selectedStaff.first_name || '',
            visitor_name: formData.visitor_name,
            visitor_email: formData.visitor_email,
            department_name: deptName,
            division_name: divName,
            appointment_date: formData.appointment_date,
            message: formData.message || '',
            staff_name: selectedStaff.full_name || selectedStaff.first_name || '',
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }
      
      setReferenceNumber(data.reference_number || `GPX-${Date.now()}`);
      setShowSuccess(true);
      showToastMessage('Visit request submitted successfully!');
    } catch (error) {
      console.error('Failed to submit visit request:', error);
      const detail = error?.response?.data;
      const firstField = detail && typeof detail === 'object' ? Object.keys(detail)[0] : null;
      const fieldMessage = firstField ? `${firstField}: ${detail[firstField]}` : null;
      showToastMessage(fieldMessage || 'Failed to submit visit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setShowSuccess(false);
    setReferenceNumber('');
    setPrefillSelection(null);
    setFormData({
      visitor_name: '',
      visitor_email: '',
      phone: '',
      department: '',
      division: '',
      staff_member: '',
      appointment_date: '',
      message: '',
    });
    setValidation({
      nameValid: false,
      emailValid: false,
      emailError: false,
      dateValid: false,
      dateError: false,
    });
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleMode = () => {
    setIsReceptionistMode(!isReceptionistMode);
    showToastMessage(isReceptionistMode ? 'Visitor Mode ON' : 'Receptionist Mode ON');
  };

  const getDeptName = (deptId) => {
    const dept = departments.find(d => d.id === parseInt(deptId));
    return dept ? dept.name : deptId;
  };

  const getStaffName = (staffId) => {
    const s = staff.find(st => st.id === parseInt(staffId));
    return s ? (s.full_name || `${s.first_name} ${s.last_name}`.trim()) : staffId;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBC';
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', { 
      timeZone: EAT_TIMEZONE,
      day: '2-digit', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return 'TBC';
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', { 
      timeZone: EAT_TIMEZONE,
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Check if selected date is more than 30 days in advance (next day selection)
  const isNextDaySelection = (dateStr) => {
    if (!dateStr) return false;
    const selected = new Date(dateStr);
    // Use EAT timezone for comparison
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return selected > thirtyDaysFromNow;
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getStaffInitials = (member) => {
    if (member.first_name || member.last_name) return getInitials(member.first_name, member.last_name);
    const { first, last } = splitFullName(member.full_name || '');
    return getInitials(first, last);
  };

  const getAvatarColor = (index) => {
    const colors = [
      { bg: '#dbeafe', color: '#1d4ed8' },
      { bg: '#ede9fe', color: '#5b21b6' },
      { bg: '#dcfce7', color: '#15803d' },
      { bg: '#fef3c7', color: '#b45309' },
      { bg: '#fce7f3', color: '#be185d' },
    ];
    return colors[index % colors.length];
  };

  const deptIcons = [ICONS.wrench, ICONS.cash, ICONS.users, ICONS.gear, ICONS.scales];

  const normalize = (value) => (value || '').toString().toLowerCase();

  const toId = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const getDeptId = (member) => toId(member.department?.id ?? member.department_id ?? member.departmentId ?? member.department ?? null);
  const getDivisionId = (member) => toId(member.division?.id ?? member.division_id ?? member.divisionId ?? member.division ?? null);
  const getDeptNameFromId = (deptId) => departments.find(d => d.id === deptId)?.name || '';
  const getDivisionNameFromId = (divId) => divisions.find(d => d.id === divId)?.name || '';
  const getStaffNameFromId = (staffId) => allStaff.find(s => s.id === staffId)?.full_name || allStaff.find(s => s.id === staffId)?.first_name || '';

  const splitFullName = (value = '') => {
    const parts = value.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return { first: '', last: '' };
    if (parts.length === 1) return { first: parts[0], last: '' };
    return { first: parts[0], last: parts.slice(1).join(' ') };
  };

  const normalizeStaff = (member) => {
    const fullName = member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim();
    const { first, last } = splitFullName(fullName);
    return {
      ...member,
      first_name: member.first_name || first,
      last_name: member.last_name || last,
      full_name: fullName,
      department: member.department?.id ? member.department : {
        id: getDeptId(member),
        name: member.department_name || getDeptNameFromId(getDeptId(member)) || '',
      },
      division: member.division?.id ? member.division : {
        id: getDivisionId(member),
        name: member.division_name || '',
      },
      is_available: typeof member.is_available === 'boolean' ? member.is_available : !!member.is_active,
      availability_reason: member.availability_reason || '',
    };
  };

  const getStaffSearchText = (member) => {
    const name = `${member.first_name || ''} ${member.last_name || ''}`.trim();
    const deptName = member.department?.name || getDeptNameFromId(getDeptId(member)) || '';
    const division = member.division?.name || '';
    const title = member.title || member.role || '';
    const desc = member.description || member.bio || member.specialty || '';
    return normalize(`${name} ${deptName} ${division} ${title} ${desc}`);
  };

  const matchesTerm = (member, term) => getStaffSearchText(member).includes(term);

  const getDepartmentStaff = (deptId) => allStaff.filter(s => getDeptId(s) === deptId);

  const handleDepartmentClick = async (dept) => {
    if (activeDeptId === dept.id) {
      setActiveDeptId(null);
      setDrawerDivisions([]);
      setActiveDivisionId('all');
      setDeptSearchTerm('');
      return;
    }
    setActiveDeptId(dept.id);
    setActiveDivisionId('all');
    setDeptSearchTerm('');
    try {
      const { data } = await api.get(`/divisions/?department_id=${dept.id}`);
      setDrawerDivisions(data);
    } catch (error) {
      console.error(error);
      setDrawerDivisions([]);
    }
  };

  const handleBookWithStaff = (member) => {
    if (!member.is_available) {
      const hostName = member.full_name || member.first_name || 'This host';
      const reasonText = (member.availability_reason || '').trim();
      showToastMessage(
        reasonText
          ? `You can't alert ${hostName} right now: ${reasonText}`
          : `You can't alert ${hostName} right now because they're unavailable.`
      );
      return;
    }
    if (isStaffUnavailableOnDate(member.id, formData.appointment_date)) {
      showToastMessage('That staff member is unavailable on the selected date.');
      return;
    }
    const departmentId = (getDeptId(member) ?? '').toString();
    const divisionId = (getDivisionId(member) ?? '').toString();
    setFormData(prev => ({
      ...prev,
      department: departmentId,
      division: divisionId,
      staff_member: member.id,
    }));
    setPrefillSelection({
      staffName: member.full_name || `${member.first_name} ${member.last_name}`.trim(),
      departmentName: member.department?.name || getDeptNameFromId(getDeptId(member)) || 'Department',
      divisionName: member.division?.name || '',
    });
    setCurrentStep(1);
    if (isMobileView) {
      setShowBookingModal(false);
      revealMobileHeroForm();
    } else {
      setShowBookingModal(true);
    }
  };

  const handleAlertHost = () => {
    if (!hasAvailableStaff) {
      const reason = (firstOfflineStaff?.availability_reason || '').trim();
      const fallbackName = firstOfflineStaff?.full_name || 'your host';
      showToastMessage(
        reason
          ? `You can't alert ${fallbackName} right now: ${reason}`
        : 'You can\'t alert a host right now because everyone is unavailable. Please try again later.'
      );
      return;
    }
    if (isMobileView) {
      revealMobileHeroForm();
    } else {
      setShowBookingModal(true);
    }
  };

  const selectedStaff = formData.staff_member ? allStaff.find((member) => String(member.id) === String(formData.staff_member)) : null;
  const hasAvailableStaff = allStaff.some((member) => member.is_available);
  const firstOfflineStaff = allStaff.find((member) => !member.is_available);
  const heroUnavailableStaff = selectedStaff?.is_available === false ? selectedStaff : (!hasAvailableStaff ? firstOfflineStaff : null);
  const heroUnavailableLabel = heroUnavailableStaff
    ? heroUnavailableStaff.full_name
      ? `${heroUnavailableStaff.full_name} is offline`
      : 'Hosts temporarily offline'
    : '';
  const heroUnavailableDetail = heroUnavailableStaff
    ? heroUnavailableStaff.availability_reason || 'Visitors cannot alert this host right now.'
    : '';

  const normalizedGlobalTerm = normalize(globalSearchTerm).trim();
  const normalizedDeptTerm = normalize(deptSearchTerm).trim();
  const staffDateBlocked = (staffId) => isStaffUnavailableOnDate(staffId, formData.appointment_date);

  const globalResults = normalizedGlobalTerm
    ? allStaff.filter(member => matchesTerm(member, normalizedGlobalTerm))
        .sort((a, b) => (b.is_available === a.is_available ? 0 : b.is_available ? 1 : -1))
        .slice(0, 8)
    : [];

  const filteredDepartments = normalizedGlobalTerm
    ? departments.filter(dept => {
        if (normalize(dept.name).includes(normalizedGlobalTerm)) return true;
        return getDepartmentStaff(dept.id).some(member => matchesTerm(member, normalizedGlobalTerm));
      })
    : departments;

  const drawerStaff = activeDeptId ? getDepartmentStaff(activeDeptId) : [];
  const filteredDrawerStaff = drawerStaff
    .filter(member => {
      if (activeDivisionId === 'all') return true;
      return getDivisionId(member) === parseInt(activeDivisionId, 10);
    })
    .filter(member => (normalizedDeptTerm ? matchesTerm(member, normalizedDeptTerm) : true))
    .sort((a, b) => (b.is_available === a.is_available ? 0 : b.is_available ? 1 : -1));

  const heroClasses = ['hero'];
  if (isMobileView) heroClasses.push('hero-mobile');
  if (isMobileView && isHeroFormVisible) heroClasses.push('hero-mobile-active');
  const heroTitleAnnounce = HERO_TYPEWRITER_LINES.map((line) => line.text).join(' ');

  return (
    <div className="home-page">
      {/* Receptionist Mode Banner */}
      {isReceptionistMode && (
        <div className="reception-banner">
          <span className="rb-icon icon" aria-hidden="true">{ICONS.monitor}</span>
          <span className="rb-text">
            <strong>Receptionist Mode Active</strong> - You are checking in on behalf of a walk-in visitor.
            All fields are required. Visitor will receive email confirmation.
          </span>
          <span className="rb-switch" onClick={toggleMode}>Switch to Visitor Mode</span>
          <span className="rb-close icon" aria-hidden="true" onClick={() => setIsReceptionistMode(false)}>
            {ICONS.close}
          </span>
        </div>
      )}

      {/* Navbar */}
      <nav className={`navbar ${homeNavOpen ? 'is-open' : ''}`}>
        <div className="nav-brand" onClick={scrollToTop} style={{ cursor: 'pointer' }}>
          <div className="nav-logo">
            <span className="icon" aria-hidden="true">{ICONS.calendar}</span>
          </div>
          <div>
            <div className="nav-name">Gatepass</div>
            <div className="nav-tagline">Visitor management system</div>
          </div>
        </div>
        <button
          className="nav-hamburger"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={homeNavOpen}
          onClick={() => setHomeNavOpen((prev) => !prev)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className="nav-center">
          <div className="nav-tab active" onClick={() => { setHomeNavOpen(false); scrollToTop(); }}>Visitor Check-in</div>
          <div className="nav-tab" onClick={() => { setHomeNavOpen(false); scrollToSection('how'); }}>How It Works</div>
          <div className="nav-tab" onClick={() => { setHomeNavOpen(false); scrollToSection('departments'); }}>Departments</div>
        </div>

        <div className="nav-right">
          <div className="nav-open-tag">
            <div className="open-dot"></div>
            Office Open
          </div>
          <button className="nav-btn nav-btn-ghost" onClick={() => { setHomeNavOpen(false); toggleMode(); }}>
            {isReceptionistMode ? 'Visitor Mode' : 'Receptionist Mode'}
          </button>
          <button className="nav-btn nav-btn-dark" onClick={() => { setHomeNavOpen(false); navigate('/staff/login'); }}>
            Staff Login
          </button>
        </div>
        <div className={`nav-mobile ${homeNavOpen ? 'open' : ''}`}>
          <button className="nav-tab" onClick={() => { setHomeNavOpen(false); scrollToTop(); }}>Visitor Check-in</button>
          <button className="nav-tab" onClick={() => { setHomeNavOpen(false); scrollToSection('how'); }}>How It Works</button>
          <button className="nav-tab" onClick={() => { setHomeNavOpen(false); scrollToSection('departments'); }}>Departments</button>
          <button className="nav-btn nav-btn-ghost" onClick={() => { setHomeNavOpen(false); toggleMode(); }}>
            {isReceptionistMode ? 'Visitor Mode' : 'Receptionist Mode'}
          </button>
          <button className="nav-btn nav-btn-dark" onClick={() => { setHomeNavOpen(false); navigate('/staff/login'); }}>
            Staff Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={heroClasses.join(' ')} ref={heroRef}>
        {/* Left: Copy */}
        <div className="hero-left">
          <div className="hero-overline">Visitor Management Desk</div>

          <h1 className="hero-title" aria-label={heroTitleAnnounce}>
            {typedLines.map((line, index) => {
              const variant = HERO_TYPEWRITER_LINES[index]?.variant;
              const classes = ['typewriter-line', variant ? `typewriter-line--${variant}` : undefined];
              if (!typewriterDone && typingLine === index) classes.push('is-active');
              if (typewriterDone && index === HERO_TYPEWRITER_LINES.length - 1) classes.push('is-active');
              return (
                <span key={`hero-line-${index}`} className={classes.filter(Boolean).join(' ')}>
                  {line}
                </span>
              );
            })}
          </h1>

          <p className="hero-desc">
            Submit a quick visit request so reception can alert the right person instantly.
          </p>

          <div className="hero-cta-row">
            <button
              className={`cta-primary${!hasAvailableStaff ? ' cta-primary--disabled' : ''}`}
              onClick={handleAlertHost}
              disabled={!hasAvailableStaff}
            >
              <span className="icon" aria-hidden="true">{ICONS.clipboard}</span>
              Alert My Host
            </button>
            <div className="cta-secondary" onClick={() => scrollToSection('how')}>
              See how it works
            </div>
          </div>

          {heroUnavailableStaff && (
            <div className="hero-unavailable-panel" aria-live="polite">
              <div className="hero-unavailable-pill" />
              <div>
                <p className="hero-unavailable-label">{heroUnavailableLabel}</p>
                <p className="hero-unavailable-detail">{heroUnavailableDetail}</p>
              </div>
            </div>
          )}

          <div className="hero-trust">
            <div className="trust-item">
              <span className="trust-icon icon" aria-hidden="true">{ICONS.bolt}</span>
              <span>Instant delivery</span>
            </div>
            <div className="trust-sep"></div>
            <div className="trust-item">
              <span className="trust-icon icon" aria-hidden="true">{ICONS.mail}</span>
              <span>Email confirmation</span>
            </div>
            <div className="trust-sep"></div>
            <div className="trust-item">
              <span className="trust-icon icon" aria-hidden="true">{ICONS.bell}</span>
              <span>Push notifications</span>
            </div>
            <div className="trust-sep"></div>
            <div className="trust-item">
              <span className="trust-icon icon" aria-hidden="true">{ICONS.building}</span>
              <span>{departments.length} departments</span>
            </div>
          </div>
        </div>

        {/* Right: Visit request form */}
        <div className="hero-right">
          {isMobileView && isHeroFormVisible && (
            <button
              type="button"
              className="hero-mobile-close"
              onClick={hideMobileHeroForm}
              aria-label="Back to visitor management desk"
            >
              ← Back to desk
            </button>
          )}
          <div className="form-panel">
            {!showSuccess ? (
              <>
                <div className="form-panel-header">
                  <div className="form-panel-title">Visit check-in</div>
                  <div className="form-panel-sub">Let us know you're here so reception can notify your host.</div>
                </div>
                {prefillSelection && (
                  <div className="prefill-banner">
                    Visit request for <strong>{prefillSelection.staffName}</strong> · {prefillSelection.departmentName}
                    {prefillSelection.divisionName ? ` · ${prefillSelection.divisionName}` : ''}
                  </div>
                )}

                {/* Progress Steps */}
                <div className="progress-steps" id="progressSteps">
                  {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                    <div key={step}>
                      <div 
                        className={`step-dot ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'done' : ''}`}
                      >
                        {currentStep > step ? '\u2713' : step}
                      </div>
                      {step < 7 && <div className="step-spacer"></div>}
                    </div>
                  ))}
                  <div 
                    className="progress-fill" 
                    id="progressFill" 
                    style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 82}%` }}
                  ></div>
                </div>

                {/* Step 1: Name */}
                <div className={`step-view ${currentStep === 1 ? 'active' : ''}`} id="step1">
                  <div className="step-label">Step 1 of 7 - Your Identity</div>
                  <div className="field">
                    <label className="field-label">Full Name <span className="field-required">*</span></label>
                    <input 
                      type="text" 
                      className={`field-input ${validation.nameValid ? 'valid' : ''}`}
                      placeholder="e.g. Sarah Kiprono"
                      value={formData.visitor_name}
                      onChange={(e) => handleInputChange('visitor_name', e.target.value)}
                    />
                    <div className="field-hint">Your name as you'd like to be announced</div>
                  </div>
                  <div className="field">
                    <label className="field-label">Phone Number</label>
                    <input 
                      type="tel" 
                      className="field-input"
                      placeholder="+254 700 000 000"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                    <div className="field-hint">Optional - for SMS reminders</div>
                  </div>
                  <div className="step-nav">
                    <button 
                      className="step-btn step-next" 
                      onClick={() => validation.nameValid && goToStep(2)}
                      disabled={!validation.nameValid}
                    >
                      Continue
                    </button>
                  </div>
                </div>

                {/* Step 2: Email */}
                <div className={`step-view ${currentStep === 2 ? 'active' : ''}`} id="step2">
                  <div className="step-label">Step 2 of 7 - Contact Details</div>
                  <div className="field">
                    <label className="field-label">Email Address <span className="field-required">*</span></label>
                    <input 
                      type="email" 
                      className={`field-input ${validation.emailValid ? 'valid' : ''} ${validation.emailError ? 'error' : ''}`}
                      placeholder="your@email.com"
                      value={formData.visitor_email}
                      onChange={(e) => handleInputChange('visitor_email', e.target.value)}
                    />
                      <div className={`field-hint ${validation.emailValid ? 'field-valid-msg' : ''} ${validation.emailError ? 'field-error' : ''}`}>
                        {validation.emailValid 
                          ? `Confirmation will be sent to ${formData.visitor_email}`
                          : 'Your visit confirmation and updates will be sent here'
                        }
                      </div>
                  </div>
                  <div className="step-nav">
                    <button className="step-btn step-back" onClick={() => goToStep(1)}>Back</button>
                    <button 
                      className="step-btn step-next" 
                      onClick={() => validation.emailValid && goToStep(3)}
                      disabled={!validation.emailValid}
                    >
                      Continue
                    </button>
                  </div>
                </div>

                {/* Step 3: Host details */}
                <div className={`step-view ${currentStep === 3 ? 'active' : ''}`} id="step3">
                  <div className="step-label">Step 3 of 7 - Host details</div>
                  <div className="field">
                    <label className="field-label">Who are you here to see? <span className="field-required">*</span></label>
                    <div className="select-wrap">
                      <select 
                        className="field-input"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                      >
                        <option value="">Search by department or staff name</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field-hint">Not sure? Check the Departments directory below</div>
                  </div>
                  <div className="step-nav">
                    <button className="step-btn step-back" onClick={() => goToStep(2)}>Back</button>
                    <button 
                      className="step-btn step-next" 
                      onClick={() => formData.department && goToStep(4)}
                      disabled={!formData.department}
                    >
                      Continue
                    </button>
                  </div>
                </div>

                {/* Step 4: Division */}
                <div className={`step-view ${currentStep === 4 ? 'active' : ''}`} id="step4">
                  <div className="step-label">Step 4 of 7 - Division</div>
                  <div className="field">
                    <label className="field-label">Which division? <span className="field-required">*</span></label>
                    <div className="select-wrap">
                      <select 
                        className="field-input"
                        value={formData.division}
                        onChange={(e) => handleInputChange('division', e.target.value)}
                      >
                        <option value="">Choose a division...</option>
                        {divisions.map((div) => (
                          <option key={div.id} value={div.id}>{div.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="step-nav">
                    <button className="step-btn step-back" onClick={() => goToStep(3)}>Back</button>
                    <button 
                      className="step-btn step-next" 
                      onClick={() => formData.division && goToStep(5)}
                      disabled={!formData.division}
                    >
                      Continue
                    </button>
                  </div>
                </div>

                {/* Step 5: Staff */}
                <div className={`step-view ${currentStep === 5 ? 'active' : ''}`} id="step5">
                  <div className="step-label">Step 5 of 7 - Select your host</div>
                  <div className="field">
                    <label className="field-label">Select your host <span className="field-required">*</span></label>
                    <div className="staff-cards">
                      {staff.length > 0 ? (
                        staff.map((s, index) => {
                          const isSelectable = s.is_available && !staffDateBlocked(s.id);
                          const statusText = !s.is_available
                            ? 'Unavailable'
                            : staffDateBlocked(s.id)
                                ? 'Unavailable (date blocked)'
                                : 'Available';
                          const statusColor = isSelectable ? 'var(--green)' : 'var(--ink-faint)';
                          return (
                            <div 
                              key={s.id}
                              className={`staff-pick-card ${formData.staff_member === s.id ? 'selected' : ''} ${!isSelectable ? 'unavailable' : ''}`}
                              onClick={() => isSelectable && handleInputChange('staff_member', s.id)}
                              style={{ opacity: isSelectable ? 1 : 0.55, pointerEvents: isSelectable ? 'auto' : 'none' }}
                            >
                              <div 
                                className="spc-avatar"
                                style={{ background: getAvatarColor(index).bg, color: getAvatarColor(index).color }}
                              >
                                {getInitials(s.first_name, s.last_name)}
                              </div>
                              <div>
                                <div className="spc-name">{s.first_name} {s.last_name}</div>
                                <div className="spc-role">{s.division?.name || 'Staff'}</div>
                              </div>
                              <div className="spc-status">
                                <div className="spc-dot" style={{ background: statusColor }}></div>
                                <span style={{ color: statusColor }}>
                                  {statusText}
                                </span>
                              </div>
                              {!isSelectable && s.availability_reason && (
                                <div className="spc-status-hint">{s.availability_reason}</div>
                              )}
                              <div className="spc-check icon" aria-hidden="true">{ICONS.check}</div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="field-hint">Select a division first to see available staff</div>
                      )}
                    </div>
                  </div>
                  {formData.appointment_date && formData.staff_member && staffDateBlocked(formData.staff_member) && (
                    <div className="field-hint field-error">Selected staff is unavailable on this date.</div>
                  )}
                  <div className="step-nav">
                    <button className="step-btn step-back" onClick={() => goToStep(4)}>Back</button>
                    <button 
                      className="step-btn step-next" 
                      onClick={() => formData.staff_member && goToStep(6)}
                      disabled={!formData.staff_member}
                    >
                      Continue
                    </button>
                  </div>
                </div>

                {/* Step 6: Arrival */}
                <div className={`step-view ${currentStep === 6 ? 'active' : ''}`} id="step6">
                  <div className="step-label">Step 6 of 7 - Expected arrival time</div>
                  <div className="field">
                    <label className="field-label">Expected arrival time <span className="field-required">*</span> (EAT Timezone)</label>
                    <input 
                      type="datetime-local" 
                      className={`field-input ${validation.dateValid ? 'valid' : ''} ${validation.dateError ? 'error' : ''}`}
                      value={formData.appointment_date}
                      onChange={(e) => handleInputChange('appointment_date', e.target.value)}
                      min={new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                      max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                    />
                    <div className={`field-hint ${validation.dateValid ? 'field-valid-msg' : ''} ${validation.dateError ? 'field-error' : ''}`}>
                      {validation.dateValid
                        ? formatDate(formData.appointment_date)
                        : 'Leave blank if you are already on site.'
                      }
                    </div>
                  </div>
                  <div className="info-box">
                    Prefer a future arrival? Choose within office hours (8 AM - 5 PM EAT) so we can badge your host. If you are already waiting, leave this blank and reception will note your walk-in.
                  </div>
                  <div className="step-nav">
                    <button className="step-btn step-back" onClick={() => goToStep(5)}>Back</button>
                    <button 
                      className="step-btn step-next" 
                      onClick={() => validation.dateValid && goToStep(7)}
                      disabled={!validation.dateValid}
                    >
                      Continue
                    </button>
                  </div>
                </div>

                {/* Step 7: Message & Summary */}
                <div className={`step-view ${currentStep === 7 ? 'active' : ''}`} id="step7">
                  <div className="step-label">Step 7 of 7 - Your Message</div>

                  {/* Summary Card */}
                  <div className="summary-card">
                    <div className="summary-title">Visit summary</div>
                    <div className="summary-content">
                      <div className="summary-row">
                        <span className="summary-label">Visitor</span>
                        <strong>{formData.visitor_name || 'N/A'}</strong>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Department</span>
                        <strong>{getDeptName(formData.department)}</strong>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Staff Member</span>
                        <strong>{getStaffName(formData.staff_member)}</strong>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Date & Time</span>
                        <strong>{formatDateShort(formData.appointment_date)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">
                      Message to staff 
                      <span style={{ color: 'var(--ink-faint)', fontWeight: 400, letterSpacing: 0, textTransform: 'none', fontSize: '11px' }}>(optional)</span>
                    </label>
                    <textarea 
                      className="field-input"
                      rows="4"
                      placeholder="Briefly describe the purpose of your visit or any details the staff should know..."
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      maxLength={500}
                    />
                    <div className="field-hint">{formData.message.length} / 500 characters</div>
                  </div>

                  <div className="info-box">
                    <span className="icon" aria-hidden="true">{ICONS.mail}</span>
                    <span>A confirmation will be sent to <strong>{formData.visitor_email}</strong>. Reception will notify you once your host responds.</span>
                  </div>

                  <div className="step-nav">
                    <button className="step-btn step-back" onClick={() => goToStep(6)}>Back</button>
                    <button
                      className={`step-btn step-submit${isSubmitting ? ' submitting' : ''}`}
                      onClick={submitBooking}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'SUBMITTING REQUEST' : 'Submit visit request'}
                      {isSubmitting && (
                        <span className="loading-dots" aria-hidden="true">
                          <span></span>
                          <span></span>
                          <span></span>
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Success Screen */
                <div className="success-screen show">
                <div className="success-icon icon" aria-hidden="true">{ICONS.checkCircle}</div>
                <div className="success-title">Visit request submitted!</div>
                <div className="success-sub">
                  Your visit request has been sent to <strong>{getStaffName(formData.staff_member)}</strong>. 
                  Reception will notify you by email and push when they respond.
                </div>
                <div className="success-ref">REF: {referenceNumber}</div>
                <div className="success-detail">
                  <div className="sd-row">
                    <span className="sd-label">Visitor</span>
                    <span className="sd-value">{formData.visitor_name}</span>
                  </div>
                  <div className="sd-row">
                    <span className="sd-label">Department</span>
                    <span className="sd-value">{getDeptName(formData.department)}</span>
                  </div>
                  <div className="sd-row">
                    <span className="sd-label">Requested Date</span>
                    <span className="sd-value">{formatDate(formData.appointment_date)}</span>
                  </div>
                  <div className="sd-row">
                    <span className="sd-label">Status</span>
                    <span className="sd-value" style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="icon" aria-hidden="true">{ICONS.hourglass}</span>
                      Awaiting response
                    </span>
                  </div>
                </div>
                <div className="success-actions">
                  <button className="step-btn step-back" style={{ borderColor: 'var(--border2)' }} onClick={resetForm}>
                    Submit another visit request
                  </button>
                  <button className="step-btn step-next" onClick={() => showToastMessage('Confirmation resent to your email!')}>
                    Resend confirmation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section section-alt" id="how">
        <div className="section-label">Process</div>
        <div className="section-title">How it <em>works</em></div>
        <div className="section-sub">Submit a visitor check-in and reception will alert your host within seconds.</div>
        <div className="how-steps">
          <div className="how-step">
            <div className="how-num">1</div>
            <div className="how-step-title">Enter your host&apos;s name</div>
            <div className="how-step-desc">Type the person or department you are here to see so reception knows who to notify.</div>
          </div>
          <div className="how-step">
            <div className="how-num">2</div>
            <div className="how-step-title">Confirm your visit purpose</div>
            <div className="how-step-desc">Let us know why you are visiting so the host gets the right context before they respond.</div>
          </div>
          <div className="how-step">
            <div className="how-num">3</div>
            <div className="how-step-title">Reception alerts the host instantly</div>
            <div className="how-step-desc">Reception will page or message your host and keep you updated as soon as they respond.</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="section-label">Features</div>
        <div className="section-title">Everything you <em>need</em></div>
        <div className="section-sub">A modern visitor management tool for receptionists and hosts coordinating walk-ins and scheduled visits.</div>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="fc-icon" style={{ background: 'var(--gold-light)' }}>
              <span className="icon" aria-hidden="true">{ICONS.mail}</span>
            </div>
            <div className="fc-title">Instant Email Confirmation</div>
            <div className="fc-desc">Get a confirmation email the moment your request is submitted. No waiting, no uncertainty.</div>
          </div>
          <div className="feature-card">
            <div className="fc-icon" style={{ background: 'var(--teal-light)' }}>
              <span className="icon" aria-hidden="true">{ICONS.bell}</span>
            </div>
            <div className="fc-title">Push Notifications</div>
            <div className="fc-desc">Enable push notifications and get alerted the second your visitor check-in status changes.</div>
          </div>
          <div className="feature-card">
            <div className="fc-icon" style={{ background: 'var(--green-light)' }}>
              <span className="icon" aria-hidden="true">{ICONS.check}</span>
            </div>
            <div className="fc-title">Real-time Status Updates</div>
            <div className="fc-desc">Track your visit request status - Pending, Accepted, Rescheduled, or Declined - in real time.</div>
          </div>
          <div className="feature-card">
            <div className="fc-icon" style={{ background: '#fce7f3' }}>
              <span className="icon" aria-hidden="true">{ICONS.map}</span>
            </div>
            <div className="fc-title">Department Routing</div>
            <div className="fc-desc">Your request is routed directly to the right team and staff member - no misdirected emails.</div>
          </div>
          <div className="feature-card">
            <div className="fc-icon" style={{ background: '#dbeafe' }}>
              <span className="icon" aria-hidden="true">{ICONS.phone}</span>
            </div>
            <div className="fc-title">Works on Any Device</div>
            <div className="fc-desc">Fully responsive PWA. Check in from your phone, tablet, or desktop - install it like a native app.</div>
          </div>
          <div className="feature-card">
            <div className="fc-icon" style={{ background: 'var(--surface2)' }}>
              <span className="icon" aria-hidden="true">{ICONS.monitor}</span>
            </div>
            <div className="fc-title">Receptionist Mode</div>
            <div className="fc-desc">Receptionists can switch to an assisted check-in mode to help walk-in visitors notify their host quickly.</div>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="section section-alt" id="departments">
        <div className="section-label">Directory</div>
        <div className="section-title">Our <em>Departments</em></div>
        <div className="section-sub">Find the right person fast, then jump straight to check-in.</div>

        <div className="dept-search">
          <div className="dept-search-title">Find your person</div>
          <div className="dept-search-input">
            <input
              type="text"
              placeholder="Search staff by name, department, or topic…"
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
            />
            <span className="icon" aria-hidden="true">{ICONS.search}</span>
          </div>
          {globalResults.length > 0 && (
            <div className="dept-search-results">
              {globalResults.map((member, index) => {
                const isMemberSelectable = member.is_available && !staffDateBlocked(member.id);
                const memberStatus = !member.is_available
                  ? 'Unavailable'
                  : staffDateBlocked(member.id)
                      ? 'Unavailable (date blocked)'
                      : 'Available';
                return (
                  <button
                    key={`${member.id}-${index}`}
                    className="search-result"
                    type="button"
                    onClick={() => handleBookWithStaff(member)}
                    disabled={!isMemberSelectable}
                  >
                  <span
                    className="search-avatar"
                    style={{ background: getAvatarColor(index).bg, color: getAvatarColor(index).color }}
                  >
                    {getStaffInitials(member)}
                  </span>
                  <span className="search-info">
                    <span className="search-name">{member.full_name || `${member.first_name} ${member.last_name}`.trim()}</span>
                    <span className="search-meta">
                      {member.department?.name || getDeptNameFromId(getDeptId(member)) || 'Department'} · {member.division?.name || 'Division'}
                    </span>
                  </span>
                  <span className={`search-status ${isMemberSelectable ? 'available' : 'unavailable'}`}>
                    <span className="status-dot" />
                    {memberStatus}
                  </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="dept-card-grid">
          {filteredDepartments.map((dept, deptIndex) => {
            const deptStaff = getDepartmentStaff(dept.id);
            const previewStaff = deptStaff.slice(0, 3);
            const availableCount = deptStaff.filter(member => member.is_available && !staffDateBlocked(member.id)).length;
            const hasAvailable = availableCount > 0;

            return (
              <div key={dept.id} className="dept-card-wrap">
                <button
                  type="button"
                  className={`dept-card ${activeDeptId === dept.id ? 'active' : ''}`}
                  onClick={() => handleDepartmentClick(dept)}
                >
                  <div className="dept-card-head">
                    <div
                      className="dept-card-icon"
                      style={{ background: ['#dbeafe', 'var(--green-light)', 'var(--gold-light)', '#ede9fe', '#fce7f3'][deptIndex % 5] }}
                    >
                      <span className="icon" aria-hidden="true">
                        {deptIcons[deptIndex % deptIcons.length]}
                      </span>
                    </div>
                    <div>
                      <div className="dept-card-name">{dept.name}</div>
                      <div className="dept-card-count">{dept.staff_count || deptStaff.length} people</div>
                    </div>
                    <div className={`dept-availability ${hasAvailable ? 'live' : ''}`} title={hasAvailable ? 'Someone available now' : 'All currently busy'} />
                  </div>
                  <div className="dept-card-preview">
                    <div className="dept-avatar-stack">
                      {previewStaff.map((member, index) => (
                        <span
                          key={`${member.id}-${index}`}
                          className="dept-avatar"
                          style={{ background: getAvatarColor(index).bg, color: getAvatarColor(index).color }}
                        >
                          {getStaffInitials(member)}
                        </span>
                      ))}
                    </div>
                    <div className="dept-preview-text">
                      {availableCount > 0
                        ? `${availableCount} available now`
                        : 'No one available right now'}
                    </div>
                  </div>
                </button>

                {activeDeptId === dept.id && (
                  <div className="dept-drawer open">
                    <div className="drawer-head">
                      <div className="drawer-title">{dept.name}</div>
                      <div className="drawer-sub">Who are you looking for?</div>
                    </div>

                    <div className="drawer-search">
                      <input
                        type="text"
                        placeholder="Search by name or topic..."
                        value={deptSearchTerm}
                        onChange={(e) => setDeptSearchTerm(e.target.value)}
                      />
                      <span className="icon" aria-hidden="true">{ICONS.search}</span>
                    </div>

                    <div className="division-pills">
                      <button
                        type="button"
                        className={`division-pill ${activeDivisionId === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveDivisionId('all')}
                      >
                        All
                      </button>
                      {drawerDivisions.map((division) => (
                        <button
                          key={division.id}
                          type="button"
                          className={`division-pill ${activeDivisionId === division.id.toString() ? 'active' : ''}`}
                          onClick={() => setActiveDivisionId(division.id.toString())}
                        >
                          {division.name}
                        </button>
                      ))}
                    </div>

                    <div className="dept-staff-grid">
                      {filteredDrawerStaff.length > 0 ? (
                        filteredDrawerStaff.map((member, index) => {
                          const isMemberSelectable = member.is_available && !staffDateBlocked(member.id);
                          const memberStatus = !member.is_available
                            ? 'Unavailable'
                            : staffDateBlocked(member.id)
                                ? 'Unavailable (date blocked)'
                                : 'Available';
                          return (
                            <div
                              key={`${member.id}-${index}`}
                              className={`dept-staff-card ${isMemberSelectable ? 'available' : 'unavailable'}`}
                            >
                            <div className="dept-staff-head">
                              <span
                                className="dept-staff-avatar"
                                style={{ background: getAvatarColor(index).bg, color: getAvatarColor(index).color }}
                              >
                                {getStaffInitials(member)}
                              </span>
                              <div>
                                <div className="dept-staff-name">{member.full_name || `${member.first_name} ${member.last_name}`.trim()}</div>
                                <div className="dept-staff-division">{member.division?.name || 'Division'}</div>
                              </div>
                            </div>
                            <div className="dept-staff-status">
                              <span className="status-dot" />
                              {memberStatus}
                            </div>
                          <div className="dept-staff-desc">
                            {member.description || member.bio || member.specialty || member.role || 'Ready to help with your request.'}
                          </div>
                          {!isMemberSelectable && member.availability_reason && (
                            <p className="dept-staff-reason">
                              {member.availability_reason}
                            </p>
                          )}
                          <button type="button" className="dept-book-btn" onClick={() => handleBookWithStaff(member)} disabled={!isMemberSelectable}>
                              Check in with {(member.full_name || member.first_name || 'Staff').split(' ')[0]} →
                            </button>
                          </div>
                          );
                        })
                      ) : (
                        <div className="dept-empty">No staff match your search.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div>
          <div className="footer-brand">Gatepass</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>Visitor Management System</div>
        </div>
        <div className="footer-links">
          <a>Privacy Policy</a>
          <a>Terms of Use</a>
          <a>Contact Support</a>
          <a onClick={() => navigate('/staff/login')}>Login</a>
        </div>
        <div className="footer-copy">2026 Gatepass. All rights reserved.</div>
      </footer>

      {/* Toast */}
      {toast && (
        <div className="toast" id="toast" role="status" aria-live="polite">
          <span className="toast-icon" aria-hidden="true">{ICONS.alertCircle}</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Visit Request Modal */}
      {showBookingModal && (
        <div className="booking-modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="booking-modal-close" 
              onClick={() => setShowBookingModal(false)}
              aria-label="Close modal"
            >
              {ICONS.close}
            </button>
            <div className="booking-modal-content">
              {!showSuccess ? (
                <>
                  <div className="form-panel-header">
                    <div className="form-panel-title" style={{ color: '#ffffff' }}>Confirm visit request</div>
                    <div className="form-panel-sub">Answer a few steps so reception can notify your host.</div>
                  </div>
                  {prefillSelection && (
                    <div className="prefill-banner">
                      Visit request for <strong>{prefillSelection.staffName}</strong> · {prefillSelection.departmentName}
                      {prefillSelection.divisionName ? ` · ${prefillSelection.divisionName}` : ''}
                    </div>
                  )}

                  {/* Progress Steps */}
                  <div className="progress-steps" id="progressSteps">
                    {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                      <div key={step}>
                        <div 
                          className={`step-dot ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'done' : ''}`}
                        >
                          {currentStep > step ? '\u2713' : step}
                        </div>
                        {step < 7 && <div className="step-spacer"></div>}
                      </div>
                    ))}
                    <div 
                      className="progress-fill" 
                      id="progressFill" 
                      style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 82}%` }}
                    ></div>
                  </div>

                  {/* Step 1: Name */}
                  <div className={`step-view ${currentStep === 1 ? 'active' : ''}`} id="step1">
                    <div className="step-label">Step 1 of 7 - Your Identity</div>
                    <div className="field">
                      <label className="field-label">Full Name <span className="field-required">*</span></label>
                      <input 
                        type="text" 
                        className={`field-input ${validation.nameValid ? 'valid' : ''}`}
                        placeholder="e.g. Sarah Kiprono"
                        value={formData.visitor_name}
                        onChange={(e) => handleInputChange('visitor_name', e.target.value)}
                      />
                      <div className="field-hint">Your name as you'd like to be announced</div>
                    </div>
                    <div className="field">
                      <label className="field-label">Phone Number <span className="field-required">*</span></label>
                      <input 
                        type="tel" 
                        className="field-input"
                        placeholder="e.g. +254712345678"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Step 2: Email */}
                  <div className={`step-view ${currentStep === 2 ? 'active' : ''}`} id="step2">
                    <div className="step-label">Step 2 of 7 - Contact Details</div>
                    <div className="field">
                      <label className="field-label">Email Address <span className="field-required">*</span></label>
                      <input 
                        type="email" 
                        className={`field-input ${validation.emailValid ? 'valid' : ''} ${validation.emailError ? 'error' : ''}`}
                        placeholder="e.g. sarah@example.com"
                        value={formData.visitor_email}
                        onChange={(e) => handleInputChange('visitor_email', e.target.value)}
                      />
                      <div className="field-hint">We'll send confirmation to this email</div>
                    </div>
                  </div>

                  {/* Step 3: Host details */}
                  <div className={`step-view ${currentStep === 3 ? 'active' : ''}`} id="step3">
                    <div className="step-label">Step 3 of 7 - Host details</div>
                    <div className="field">
                      <label className="field-label">Who are you here to see? <span className="field-required">*</span></label>
                      <select 
                        className="field-input field-select"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                      >
                        <option value="">Search by department or staff name</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Step 4: Division */}
                  <div className={`step-view ${currentStep === 4 ? 'active' : ''}`} id="step4">
                    <div className="step-label">Step 4 of 7 - Division</div>
                    <div className="field">
                      <label className="field-label">Select Division (Optional)</label>
                      <select 
                        className="field-input field-select"
                        value={formData.division}
                        onChange={(e) => handleInputChange('division', e.target.value)}
                      >
                        <option value="">All Divisions</option>
                        {divisions.map(div => (
                          <option key={div.id} value={div.id}>{div.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Step 5: Staff */}
                  <div className={`step-view ${currentStep === 5 ? 'active' : ''}`} id="step5">
                  <div className="step-label">Step 5 of 7 - Select your host</div>
                  <div className="field">
                    <label className="field-label">Select your host <span className="field-required">*</span></label>
                      <select 
                        className="field-input field-select"
                        value={formData.staff_member}
                        onChange={(e) => handleInputChange('staff_member', e.target.value)}
                      >
                        <option value="">Choose a staff member...</option>
                        {(formData.division 
                          ? allStaff.filter(s => getDivisionId(s) === parseInt(formData.division, 10)) 
                          : formData.department 
                            ? allStaff.filter(s => getDeptId(s) === parseInt(formData.department, 10))
                            : allStaff
                        ).map(member => (
                          <option key={member.id} value={member.id}>
                            {member.full_name || member.first_name} {member.is_available ? '' : '(Unavailable)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Step 6: Date */}
                  <div className={`step-view ${currentStep === 6 ? 'active' : ''}`} id="step6">
                    <div className="step-label">Step 6 of 7 - Expected arrival time</div>
                    <div className="field">
                      <label className="field-label">Expected arrival time <span className="field-required">*</span></label>
                      <input 
                        type="datetime-local" 
                        className={`field-input ${validation.dateValid ? 'valid' : ''} ${validation.dateError ? 'error' : ''}`}
                        value={formData.appointment_date}
                        onChange={(e) => handleInputChange('appointment_date', e.target.value)}
                      />
                      <div className="field-hint">Leave blank if you're already here</div>
                    </div>
                  </div>

                  {/* Step 7: Message */}
                  <div className={`step-view ${currentStep === 7 ? 'active' : ''}`} id="step7">
                    <div className="step-label">Step 7 of 7 - Your Message</div>
                    <div className="field">
                      <label className="field-label">Message (Optional)</label>
                      <textarea 
                        className="field-input field-textarea"
                        placeholder="Briefly describe the purpose of your visit..."
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        rows={4}
                      />
                    </div>

                    {/* Summary */}
                    <div className="booking-summary">
                      <div className="summary-title">Visit summary</div>
                      <div className="summary-row"><span>Name:</span> <strong>{formData.visitor_name || '-'}</strong></div>
                      <div className="summary-row"><span>Email:</span> <strong>{formData.visitor_email || '-'}</strong></div>
                      <div className="summary-row"><span>Phone:</span> <strong>{formData.phone || '-'}</strong></div>
                      <div className="summary-row"><span>Department:</span> <strong>{getDeptNameFromId(formData.department) || '-'}</strong></div>
                      <div className="summary-row"><span>Division:</span> <strong>{getDivisionNameFromId(formData.division) || 'All'}</strong></div>
                      <div className="summary-row"><span>Staff:</span> <strong>{getStaffNameFromId(formData.staff_member) || '-'}</strong></div>
                      <div className="summary-row"><span>Date:</span> <strong>{formData.appointment_date ? new Date(formData.appointment_date).toLocaleString() : '-'}</strong></div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="step-nav">
                    {currentStep > 1 && (
                      <button type="button" className="btn-secondary" onClick={() => setCurrentStep(currentStep - 1)}>
                        Back
                      </button>
                    )}
                    {currentStep < 7 ? (
                      <button 
                        type="button" 
                        className="btn-primary"
                        onClick={() => {
                          if (currentStep === 1 && !validation.nameValid) {
                            showToastMessage('Please enter your full name');
                            return;
                          }
                          if (currentStep === 2 && !validation.emailValid) {
                            showToastMessage('Please enter a valid email');
                            return;
                          }
                          if (currentStep === 6 && (!formData.appointment_date || !validation.dateValid || isNextDaySelection(formData.appointment_date))) {
                            showToastMessage('Please select a valid date');
                            return;
                          }
                          setCurrentStep(currentStep + 1);
                        }}
                      >
                        Continue
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        className="btn-primary"
                        onClick={submitBooking}
                      >
                        Submit visit request
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="success-view">
                  <div className="success-animation">
                    <div className="success-circle">
                      <svg viewBox="0 0 52 52" className="success-checkmark">
                        <circle className="success-circle-bg" cx="26" cy="26" r="25" fill="none"/>
                        <path className="success-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                      </svg>
                    </div>
                  </div>
                  <div className="success-title" style={{ color: '#ffffff' }}>Visit request submitted!</div>
                  <div className="success-desc">
                    Your visit request has been sent to <strong>{getStaffNameFromId(formData.staff_member)}</strong>
                  </div>
                  <div className="success-email">
                    A confirmation email has been sent to <br/><strong>{formData.visitor_email}</strong>
                  </div>
                  <div className="success-ref">
                    <span className="ref-label">Reference Number</span>
                    <span className="ref-number">{referenceNumber}</span>
                  </div>
                  <div className="success-actions">
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => {
                        setShowBookingModal(false);
                        setShowSuccess(false);
                        setCurrentStep(1);
                        setFormData({
                          visitor_name: '',
                          visitor_email: '',
                          phone: '',
                          department: '',
                          division: '',
                          staff_member: '',
                          appointment_date: '',
                          message: '',
                        });
                        setPrefillSelection(null);
                      }}
                    >
                      Back to Home
                    </button>
                    <button 
                      type="button" 
                      className="btn-primary"
                      onClick={() => {
                        setShowSuccess(false);
                        setCurrentStep(1);
                        setFormData({
                          visitor_name: '',
                          visitor_email: '',
                          phone: '',
                          department: '',
                          division: '',
                          staff_member: '',
                          appointment_date: '',
                          message: '',
                        });
                        setPrefillSelection(null);
                      }}
                    >
                      Submit another visit request
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
