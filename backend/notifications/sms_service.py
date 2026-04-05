import os

import africastalking

africastalking.initialize(
    username=os.getenv("AT_USERNAME"),
    api_key=os.getenv("AT_API_KEY")
)

sms = africastalking.SMS


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

    try:
        response = sms.send(message, [normalized])
        print("SMS sent:", response)
    except Exception as exc:
        print("SMS failed:", str(exc))
