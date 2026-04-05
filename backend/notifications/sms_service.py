import logging
import os

import africastalking

logger = logging.getLogger(__name__)

AT_USERNAME = os.getenv("AT_USERNAME")
AT_API_KEY = os.getenv("AT_API_KEY")

if AT_USERNAME and AT_API_KEY:
    africastalking.initialize(username=AT_USERNAME, api_key=AT_API_KEY)
    sms = africastalking.SMS
else:
    sms = None
    logger.warning("Africa's Talking credentials not set; SMS notifications disabled.")


def normalize_phone(number):
    if not number:
        return None
    normalized = number.strip()
    if normalized.startswith("0"):
        normalized = "+254" + normalized[1:]
    elif not normalized.startswith("+"):
        normalized = "+254" + normalized
    return normalized


def send_visitor_sms(phone_number, visitor_name, staff_name, status, response_note):
    normalized = normalize_phone(phone_number)
    if not normalized:
        return

    if status == "Accepted":
        message = (
            f"Hi {visitor_name}, your visit request has been ACCEPTED "
            f"by {staff_name}. They are expecting you. "
            f"Message: {response_note}"
        )
    elif status == "Declined":
        message = (
            f"Hi {visitor_name}, your visit request was DECLINED "
            f"by {staff_name}. Reason: {response_note}"
        )
    elif status == "Rescheduled":
        message = (
            f"Hi {visitor_name}, {staff_name} has requested to "
            f"reschedule your visit. Details: {response_note}"
        )
    else:
        message = (
            f"Hi {visitor_name}, your visit request status "
            f"has been updated to {status} by {staff_name}."
        )

    if not sms:
        logger.warning("Skip SMS: Africa's Talking is not configured.")
        return
    try:
        response = sms.send(message, [normalized])
        logger.info("SMS sent: %s", response)
    except Exception as exc:
        logger.error("SMS failed: %s", exc)
