import logging
import os

import requests

logger = logging.getLogger(__name__)

UMS_API_KEY = os.getenv("UMS_API_KEY")
UMS_APP_ID = os.getenv("UMS_APP_ID")
UMS_URL = "https://comms.umeskiasoftwares.com/api/v1/sms/send"
SENDER_ID = "UMS_SMS"

print(f"SMS SERVICE INIT — UMS_API_KEY present: {bool(UMS_API_KEY)}")
print(f"SMS SERVICE INIT — UMS_APP_ID: {UMS_APP_ID}")


def normalize_phone(number):
    if not number:
        return None
    normalized = number.strip()
    if normalized.startswith("0"):
        normalized = "254" + normalized[1:]
    elif normalized.startswith("+"):
        normalized = normalized[1:]
    return normalized


def send_sms(phone_number, message):
    """Core send function — calls UMSComms API."""
    normalized = normalize_phone(phone_number)
    if not normalized:
        print("SMS ABORTED — phone number empty or invalid")
        return False

    if not UMS_API_KEY or not UMS_APP_ID:
        print("SMS ABORTED — UMSComms credentials not configured")
        return False

    payload = {
        "api_key": UMS_API_KEY,
        "app_id": UMS_APP_ID,
        "sender_id": SENDER_ID,
        "message": message,
        "phone": normalized,
    }

    try:
        print(f"SMS SENDING — to: {normalized}")
        response = requests.post(UMS_URL, json=payload, timeout=10)
        result = response.json()
        print(f"SMS RESPONSE — {result}")

        if result.get("status") == "complete":
            logger.info("SMS sent successfully to %s", normalized)
            return True
        else:
            logger.error("SMS failed: %s", result)
            return False

    except Exception as e:
        logger.error("SMS exception: %s", str(e))
        return False


def send_visitor_sms(phone_number, visitor_name, staff_name, status, response_note):
    """Send response notification to visitor."""
    print(f"SMS ATTEMPT — phone: {phone_number}, visitor: {visitor_name}, status: {status}")

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
            f"Hi {visitor_name}, your visit status has been "
            f"updated to {status} by {staff_name}."
        )

    message = message[:160]
    return send_sms(phone_number, message)


def send_staff_sms(phone_number, staff_name, message):
    """Send alert to staff when a visitor checks in."""
    print(f"Staff SMS CALLED — phone: {phone_number}, staff: {staff_name}")

    final_message = f"Hi {staff_name}, {message}"

    final_message = final_message[:160]
    return send_sms(phone_number, final_message)
