from django.contrib import admin
from django.urls import path, include, re_path
from usuarios.urls import router as routerUsuario
from roles.urls import router as routerRol
from departamentos.urls import router as routerDepartamentos
from django.views.generic import TemplateView
from rest_framework import routers
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

schema_view = get_schema_view(
    openapi.Info(
        title="Departamentos FACET",
        default_version='v0.1',
        description="Documentación de las APIs de la aplicación",
        terms_of_service="https://www.google.com/policies/terms/",
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

router = routers.DefaultRouter()
# se extienden los routers de cada app
# router genera solo el api root con las urls
# faltan agregar las que no se registran en router
router.registry.extend(routerUsuario.registry)
router.registry.extend(routerRol.registry)
router.registry.extend(routerDepartamentos.registry)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Usuarios
    path('auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('login/', include('usuarios.urls')),  # Mover todo a 'api/'

    # Swagger
    re_path(r'^api/swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^api/swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^api/redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    # Incluir las URLs de departamentos bajo 'api'
    path('facet/', include('departamentos.urls')),
    path('facet/', include('usuarios.urls')),  # <--- Esto expone /facet/users/
    path('facet/', include('roles.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


def custom_404_view(request, exception):
    return JsonResponse({"error": "Not found"}, status=404)

handler404 = "administracion.urls.custom_404_view"