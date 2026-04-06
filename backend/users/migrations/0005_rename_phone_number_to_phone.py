from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_user_phone_number'),
    ]

    operations = [
        migrations.RenameField(
            model_name='user',
            old_name='phone_number',
            new_name='phone',
        ),
    ]
