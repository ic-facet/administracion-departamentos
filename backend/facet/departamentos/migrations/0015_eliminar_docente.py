from django.db import migrations, models
import django.db.models.deletion


def docente_a_persona(apps, schema_editor):
    """Copia el id de persona de cada Docente a las nuevas FK hacia Persona."""
    Docente = apps.get_model('departamentos', 'Docente')
    persona_de = dict(Docente.objects.values_list('id', 'persona_id'))

    destinos = [
        ('Designacion', 'docente_id', 'persona_id'),
        ('Seguimiento', 'docente_id', 'persona_id'),
        ('AsignacionFuncion', 'docente_id', 'persona_id'),
        ('Licencia', 'docente_id', 'persona_id'),
        ('Licencia', 'reemplazante_id', 'reemplazante_persona_id'),
        ('AsignaturaDocente', 'docente_id', 'persona_id'),
        ('CargoHistorial', 'docente_id', 'persona_id'),
    ]
    for nombre, origen, destino in destinos:
        Modelo = apps.get_model('departamentos', nombre)
        filas = Modelo.objects.exclude(**{f'{origen}__isnull': True})
        for pk, docente_id in filas.values_list('pk', origen):
            Modelo.objects.filter(pk=pk).update(**{destino: persona_de[docente_id]})


def _persona_fk(related_name=None, null=False, **extra):
    kwargs = dict(
        on_delete=django.db.models.deletion.CASCADE if not null
        else django.db.models.deletion.SET_NULL,
        to='departamentos.persona', null=True, **extra)
    if related_name:
        kwargs['related_name'] = related_name
    return models.ForeignKey(**kwargs)


class Migration(migrations.Migration):

    dependencies = [
        ('departamentos', '0014_seed_codigos_tipocargo'),
    ]

    operations = [
        # 1. Índices que referencian docente
        migrations.RemoveIndex(model_name='designacion', name='departament_docente_67d32d_idx'),
        migrations.RemoveIndex(model_name='seguimiento', name='departament_docente_33336f_idx'),

        # 2. Nuevas FK hacia Persona (nulas mientras se copian los datos)
        migrations.AddField('designacion', 'persona', _persona_fk('designaciones')),
        migrations.AddField('seguimiento', 'persona', _persona_fk('seguimientos')),
        migrations.AddField('asignacionfuncion', 'persona', _persona_fk('funciones')),
        migrations.AddField('licencia', 'persona', _persona_fk('licencias')),
        migrations.AddField('licencia', 'reemplazante_persona', _persona_fk('+', null=True, blank=True)),
        migrations.AddField('asignaturadocente', 'persona', _persona_fk()),
        migrations.AddField('cargohistorial', 'persona', _persona_fk(
            'historial_cargos_docentes', null=True, blank=True,
            help_text='Ocupante docente (persona). Mutuamente exclusivo con no_docente.')),

        # 3. Copia de datos docente -> persona
        migrations.RunPython(docente_a_persona),

        # 4. Se eliminan las FK viejas
        migrations.RemoveField('designacion', 'docente'),
        migrations.RemoveField('seguimiento', 'docente'),
        migrations.RemoveField('asignacionfuncion', 'docente'),
        migrations.RemoveField('licencia', 'docente'),
        migrations.RemoveField('licencia', 'reemplazante'),
        migrations.RemoveField('asignaturadocente', 'docente'),
        migrations.RemoveField('cargohistorial', 'docente'),

        # 5. Reemplazante definitivo y restricciones finales
        migrations.RenameField('licencia', 'reemplazante_persona', 'reemplazante'),
        migrations.AlterField('licencia', 'reemplazante', models.ForeignKey(
            blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
            related_name='reemplazos', to='departamentos.persona',
            help_text='Persona que cubre el cargo durante la licencia, si lo hay.')),
        migrations.AlterField('designacion', 'persona', models.ForeignKey(
            on_delete=django.db.models.deletion.CASCADE,
            related_name='designaciones', to='departamentos.persona')),
        migrations.AlterField('seguimiento', 'persona', models.ForeignKey(
            on_delete=django.db.models.deletion.CASCADE,
            related_name='seguimientos', to='departamentos.persona')),
        migrations.AlterField('asignacionfuncion', 'persona', models.ForeignKey(
            on_delete=django.db.models.deletion.CASCADE,
            related_name='funciones', to='departamentos.persona')),
        migrations.AlterField('licencia', 'persona', models.ForeignKey(
            on_delete=django.db.models.deletion.CASCADE,
            related_name='licencias', to='departamentos.persona')),
        migrations.AlterField('asignaturadocente', 'persona', models.ForeignKey(
            on_delete=django.db.models.deletion.CASCADE, to='departamentos.persona')),

        migrations.AddIndex('designacion', models.Index(
            fields=['persona', 'codigo_cargo'], name='departament_persona_301b63_idx')),
        migrations.AddIndex('seguimiento', models.Index(
            fields=['persona', 'estado_seguimiento'], name='departament_persona_2be423_idx')),

        migrations.AlterField('cargohistorial', 'no_docente', models.ForeignKey(
            blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
            related_name='historial_cargos', to='departamentos.nodocente',
            help_text='Ocupante no-docente. Mutuamente exclusivo con persona.')),

        # 6. El modelo Docente deja de existir
        migrations.DeleteModel('Docente'),
    ]
