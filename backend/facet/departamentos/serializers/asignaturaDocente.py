from rest_framework import serializers
from ..models import AsignaturaDocente, Persona, Asignatura, Resolucion, CargoDepartamento
from .persona import PersonaSerializer
from .resolucion import ResolucionSerializer
from .asignatura import AsignaturaSerializer

class AsignaturaDocenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AsignaturaDocente
        fields = '__all__'

class AsignaturaDocenteCreateSerializer(serializers.ModelSerializer):
    persona = serializers.PrimaryKeyRelatedField(queryset=Persona.objects.all())
    asignatura = serializers.PrimaryKeyRelatedField(queryset=Asignatura.objects.all())
    resolucion = serializers.PrimaryKeyRelatedField(queryset=Resolucion.objects.all())
    cargo_departamento = serializers.PrimaryKeyRelatedField(
        queryset=CargoDepartamento.objects.all(), required=False, allow_null=True)

    class Meta:
        model = AsignaturaDocente
        fields = '__all__'

class AsignaturaDocenteDetailSerializer(serializers.ModelSerializer):
    persona = PersonaSerializer()
    asignatura = AsignaturaSerializer()
    resolucion = ResolucionSerializer()

    class Meta:
        model = AsignaturaDocente
        fields = '__all__'
