# Generated by Django 5.1.1 on 2025-02-03 23:34

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('departamentos', '0005_tipotitulo'),
    ]

    operations = [
        migrations.AlterField(
            model_name='persona',
            name='titulo',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='departamentos.tipotitulo'),
        ),
    ]
