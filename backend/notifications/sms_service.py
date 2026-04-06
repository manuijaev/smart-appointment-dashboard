import logging
import os

try:
    import africastalking
except ImportError:
    africastalking = None

logger = logging.getLogger(__name__)

AT_USERNAME = os.getenv("AT_USERNAME")
AT_API_KEY = os.getenv("AT_API_KEY")

print(f"SMS SERVICE INIT — AT_USERNAME: {AT_USERNAME}")
print(f"SMS SERVICE INIT — AT_API_KEY present: {bool(AT_API_KEY)}")

sms = None
if africastalking and AT_USERNAME and AT_API_KEY:
    africastalking.initialize(username=AT_USERNAME, api_key=AT_API_KEY)
    sms = africastalking.SMS
    print("SMS SERVICE — Africa's Talking initialized successfully")
else:
    if africastalking and (AT_USERNAME or AT_API_KEY):
        logger.warning("Africa's Talking credentials missing or incomplete.")
    print("SMS SERVICE — Africa's Talking NOT initialized, credentials missing")
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


def _dispatch_sms(normalized_number, message_body, context='visitor'):
    if not normalized_number:
        print(f"SMS ABORTED — invalid {context} phone number")
        return False
    if not sms:
        print("SMS ABORTED — Africa's Talking not configured")
        logger.warning("Skip SMS: Africa's Talking is not configured.")
        return False
    try:
        response = sms.send(message_body, [normalized_number])
        print(f"SMS RESPONSE — {response}")
        logger.info("%s SMS dispatched: %s", context.capitalize(), response)
        logger.info("Africa's Talking response: %s", response)
        return True
    except Exception as exc:
        logger.error("%s SMS failed: %s", context.capitalize(), exc)
        return False


def send_visitor_sms(phone_number, visitor_name, staff_name, status, response_note):
    print(f"SMS CALLED — phone: {phone_number}, visitor: {visitor_name}, status: {status}")
    normalized = normalize_phone(phone_number)
    print(f"SMS NORMALIZED — {normalized}")

    if not normalized:
        print("SMS ABORTED — phone number is empty or invalid")
        return False

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

    return _dispatch_sms(normalized, message, context='visitor')


def send_staff_sms(
    phone_number,
    staff_name,
    visitor_name,
    appointment_date,
    department_name=None,
    division_name=None,
    visitor_phone=None,
    visitor_email=None,
    visitor_message=None,
):
    print(f"Staff SMS CALLED — phone: {phone_number}, visitor: {visitor_name}")
    normalized = normalize_phone(phone_number)
    print(f"Staff SMS NORMALIZED — {normalized}")
    if not normalized:
        print("Staff SMS ABORTED — phone number is empty or invalid")
        return False

    staff_title = staff_name or "Staff"
    message_parts = [
        f"Hi {staff_title}, you have a new visit request from {visitor_name} on {appointment_date}."
    ]
    if department_name:
        message_parts.append(f"Department: {department_name}.")
    if division_name:
        message_parts.append(f"Division: {division_name}.")
    if visitor_message:
        message_parts.append(f"Message: {visitor_message}")
    else:
        message_parts.append("Message: not provided.")
    if visitor_phone:
        message_parts.append(f"Visitor phone: {visitor_phone}.")
    if visitor_email:
        message_parts.append(f"Visitor email: {visitor_email}.")

    message = " ".join(message_parts)
    return _dispatch_sms(normalized, message, context='staff')
