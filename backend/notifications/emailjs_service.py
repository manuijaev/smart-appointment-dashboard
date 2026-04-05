import logging
import os

import requests

logger = logging.getLogger(__name__)

SERVICE_ID = os.getenv("EMAILJS_SERVICE_ID")
REQUEST_TEMPLATE_ID = os.getenv("EMAILJS_REQUEST_TEMPLATE_ID")
RESPONSE_TEMPLATE_ID = os.getenv("EMAILJS_RESPONSE_TEMPLATE_ID")
PUBLIC_KEY = os.getenv("EMAILJS_PUBLIC_KEY") or os.getenv("EMAILJS_USER_ID")
EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send"


def _is_configured():
    return bool(SERVICE_ID and PUBLIC_KEY)


def send_emailjs(template_id, template_params):
    if not _is_configured():
        logger.warning("EmailJS credentials missing; skipping email.")
        return False
    if not template_id:
        logger.warning("No EmailJS template ID provided; skipping email.")
        return False
    payload = {
        "service_id": SERVICE_ID,
        "template_id": template_id,
        "user_id": PUBLIC_KEY,
        "template_params": template_params,
    }
    try:
        response = requests.post(EMAILJS_URL, json=payload, timeout=10)
        response.raise_for_status()
        logger.info("EmailJS send successful (%s)", template_id)
        return True
    except Exception as exc:
        logger.error("EmailJS send failed (%s): %s", template_id, exc)
        return False
