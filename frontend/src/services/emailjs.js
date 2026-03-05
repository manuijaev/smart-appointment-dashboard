import axios from 'axios';

async function sendViaEmailJs(templateId, params) {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return { skipped: true, reason: 'missing_emailjs_config' };
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: params,
  };

  try {
    const res = await axios.post('https://api.emailjs.com/api/v1.0/email/send', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return { sent: true, status: res.status };
  } catch (err) {
    const raw = err?.response?.data;
    const textFromRaw =
      typeof raw === 'string'
        ? raw
        : raw?.text || raw?.message || raw?.error || JSON.stringify(raw || {});
    const detail =
      textFromRaw ||
      err?.message ||
      'EmailJS send failed';
    const code = err?.response?.status ? `HTTP ${err.response.status}` : 'HTTP ?';
    return { sent: false, error: `${code}: ${detail}` };
  }
}

export async function sendAppointmentRequestEmail({
  to_email,
  to_name,
  visitor_name,
  visitor_email,
  department_name,
  division_name,
  appointment_date,
  message,
  staff_name,
}) {
  const requestTemplateId = import.meta.env.VITE_EMAILJS_REQUEST_TEMPLATE_ID;
  const eatDate = appointment_date
    ? new Date(appointment_date).toLocaleString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Africa/Nairobi',
      })
    : '';

  return sendViaEmailJs(requestTemplateId, {
    to_email,
    to_name,
    visitor_name,
    visitor_email,
    department_name,
    division_name,
    appointment_date: eatDate,
    message,
    staff_name,
  });
}

export async function sendVisitorResponseEmail({
  visitor_name,
  visitor_email,
  status,
  response_note,
  appointment_date,
  staff_name,
  staff_email,
}) {
  const responseTemplateId =
    import.meta.env.VITE_EMAILJS_RESPONSE_TEMPLATE_ID ||
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const eatDate = appointment_date
    ? new Date(appointment_date).toLocaleString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Africa/Nairobi',
      })
    : '';

  return sendViaEmailJs(responseTemplateId, {
      to_email: visitor_email,
      to_name: visitor_name,
      from_name: staff_name,
      staff_email,
      message: response_note,
      visitor_name,
      visitor_email,
      status,
      response_note,
      appointment_date: eatDate,
      staff_name,
    });
}
