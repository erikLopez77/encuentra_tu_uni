# Generada manualmente para el modelo OutboxEvento (Outbox Pattern con RabbitMQ)

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='OutboxEvento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('routing_key', models.CharField(max_length=100)),
                ('payload', models.JSONField()),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
                ('enviado', models.BooleanField(db_index=True, default=False)),
                ('enviado_en', models.DateTimeField(blank=True, null=True)),
                ('intentos', models.PositiveSmallIntegerField(default=0)),
                ('ultimo_error', models.TextField(blank=True, default='')),
            ],
            options={
                'verbose_name': 'Evento Outbox',
                'verbose_name_plural': 'Eventos Outbox',
                'ordering': ['creado_en'],
            },
        ),
    ]
