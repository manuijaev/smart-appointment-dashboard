from django.db import models


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        ACCEPTED = 'Accepted', 'Accepted'
        RESCHEDULED = 'Rescheduled', 'Rescheduled'
        DECLINED = 'Declined', 'Declined'

    visitor_name = models.CharField(max_length=120)
    visitor_email = models.EmailField()
    department = models.ForeignKey('departments.Department', on_delete=models.CASCADE, related_name='appointments')
    division = models.ForeignKey(
        'departments.Division',
        on_delete=models.SET_NULL,
        related_name='appointments',
        null=True,
        blank=True,
    )
    staff_member = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='appointments')
    appointment_date = models.DateTimeField()
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    response_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.visitor_name} -> {self.staff_member.full_name} ({self.status})'
