from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.core.cache import cache
from .models import Favorito, Comentario
from .serializers import FavoritoSerializer, ComentarioSerializer


class FavoritoView(generics.GenericAPIView):
    """
    Ruta: /favoritos/
    Gestiona los favoritos usando los verbos HTTP correspondientes y caché:
      - GET: Consultar los favoritos del usuario (primero lee de caché; si no existe, consulta DB y cachea).
      - POST: Guardar una universidad como favorita (invalida la caché del usuario).
      - DELETE: Eliminar una universidad de favoritos (invalida la caché del usuario).
    """
    queryset = Favorito.objects.all()
    serializer_class = FavoritoSerializer

    def get_user_id(self, request):
        usuario_id = (
            request.query_params.get('usuarioId') or
            request.query_params.get('usuario_id') or
            (request.data.get('usuarioId') if hasattr(request, 'data') else None) or
            (request.user.id if request.user.is_authenticated else None)
        )
        return int(usuario_id) if usuario_id else None

    def get(self, request, *args, **kwargs):
        usuario_id = self.get_user_id(request)

        if usuario_id:
            cache_key = f"favoritos_user_{usuario_id}"
            cached_ids = cache.get(cache_key)
            if cached_ids is not None:
                return Response({
                    'favoritos': cached_ids,
                    'usuarioId': usuario_id,
                    'origen': 'cache'
                }, status=status.HTTP_200_OK)

            # Si no está en caché, consultar DB
            favoritos_qs = Favorito.objects.filter(usuarioId=usuario_id)
            favoritos_ids = list(favoritos_qs.values_list('universidadId', flat=True))

            # Guardar IDs en caché (1 hora de expiración)
            try:
                cache.set(cache_key, favoritos_ids, timeout=3600)
            except Exception:
                pass

            serializer = self.get_serializer(favoritos_qs, many=True)
            return Response({
                'favoritos': favoritos_ids,
                'results': serializer.data,
                'usuarioId': usuario_id,
                'origen': 'database'
            }, status=status.HTTP_200_OK)

        # Si no se pasó usuarioId, devolver todos los favoritos
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        universidad_id = request.data.get('universidadId')
        usuario_id = request.data.get('usuarioId')
        if not usuario_id and request.user.is_authenticated:
            usuario_id = request.user.id

        if not universidad_id:
            raise ValidationError({'universidadId': 'El ID de la universidad es obligatorio.'})
        if not usuario_id:
            raise ValidationError({'usuarioId': 'El ID de usuario es obligatorio.'})

        favorito, created = Favorito.objects.get_or_create(
            universidadId=universidad_id,
            usuarioId=usuario_id
        )

        # Invalidar caché del usuario al actualizar favoritos
        cache_key = f"favoritos_user_{usuario_id}"
        try:
            cache.delete(cache_key)
        except Exception:
            pass

        serializer = self.get_serializer(favorito)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)

    def delete(self, request, *args, **kwargs):
        universidad_id = (
            request.data.get('universidadId') or
            request.query_params.get('universidadId')
        )
        usuario_id = self.get_user_id(request)

        if not universidad_id:
            return Response({'error': "Se requiere 'universidadId' para eliminar el favorito."},
                            status=status.HTTP_400_BAD_REQUEST)
        if not usuario_id:
            return Response({'error': "Se requiere 'usuarioId' para eliminar el favorito."},
                            status=status.HTTP_400_BAD_REQUEST)

        eliminados, _ = Favorito.objects.filter(
            universidadId=universidad_id,
            usuarioId=usuario_id
        ).delete()

        # Invalidar caché del usuario
        cache_key = f"favoritos_user_{usuario_id}"
        try:
            cache.delete(cache_key)
        except Exception:
            pass

        if eliminados > 0:
            return Response({'detail': 'Universidad eliminada de favoritos.'}, status=status.HTTP_200_OK)
        return Response({'detail': 'No se encontró el favorito especificado.'}, status=status.HTTP_404_NOT_FOUND)


class ComentarioView(generics.GenericAPIView):
    """
    Ruta: /universidades/<universidad_id>/comentarios/
    Gestiona el CRUD completo de comentarios mediante verbos HTTP:
      - GET: Listar todos los comentarios de esta universidad.
      - POST: Crear comentario para la universidad (o actualizar si ya existía para el usuario).
      - PUT / PATCH: Editar un comentario existente.
      - DELETE: Eliminar un comentario de esta universidad.
    """
    serializer_class = ComentarioSerializer

    def get_queryset(self):
        universidad_id = self.kwargs.get('universidad_id')
        return Comentario.objects.filter(universidadId=universidad_id)

    def get(self, request, universidad_id, *args, **kwargs):
        comentarios = self.get_queryset()
        serializer = self.get_serializer(comentarios, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, universidad_id, *args, **kwargs):
        usuario_id = (
            request.data.get('usuarioId') or
            (request.user.id if request.user.is_authenticated else None)
        )
        if not usuario_id:
            raise ValidationError({'usuarioId': 'El ID del usuario es obligatorio.'})

        texto = request.data.get('texto')
        if not texto or not texto.strip():
            raise ValidationError({'texto': 'El comentario no puede estar vacío.'})

        calificacion = request.data.get('calificacion', 5)

        # Si el usuario ya comentó previamente en esta universidad, actualiza su reseña
        comentario_existente = Comentario.objects.filter(
            universidadId=universidad_id,
            usuarioId=usuario_id
        ).first()

        if comentario_existente:
            comentario_existente.texto = texto.strip()
            comentario_existente.calificacion = calificacion
            comentario_existente.save()
            serializer = self.get_serializer(comentario_existente)
            return Response(serializer.data, status=status.HTTP_200_OK)

        comentario = Comentario.objects.create(
            universidadId=universidad_id,
            usuarioId=usuario_id,
            texto=texto.strip(),
            calificacion=calificacion
        )
        serializer = self.get_serializer(comentario)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, universidad_id, *args, **kwargs):
        return self._actualizar_comentario(request, universidad_id)

    def patch(self, request, universidad_id, *args, **kwargs):
        return self._actualizar_comentario(request, universidad_id)

    def _actualizar_comentario(self, request, universidad_id):
        comentario_id = request.data.get('id') or request.query_params.get('id')
        usuario_id = (
            request.data.get('usuarioId') or
            (request.user.id if request.user.is_authenticated else None)
        )

        filtro = {'universidadId': universidad_id}
        if comentario_id:
            filtro['id'] = comentario_id
        elif usuario_id:
            filtro['usuarioId'] = usuario_id
        else:
            return Response(
                {'error': "Se requiere 'id' del comentario o 'usuarioId' para actualizar."},
                status=status.HTTP_400_BAD_REQUEST
            )

        comentario = Comentario.objects.filter(**filtro).first()
        if not comentario:
            return Response({'detail': 'Comentario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if 'texto' in request.data:
            comentario.texto = request.data['texto'].strip()
        if 'calificacion' in request.data:
            comentario.calificacion = request.data['calificacion']
        comentario.save()

        serializer = self.get_serializer(comentario)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, universidad_id, *args, **kwargs):
        comentario_id = (
            request.data.get('id') or
            request.query_params.get('id')
        )
        usuario_id = (
            request.data.get('usuarioId') or
            request.query_params.get('usuarioId') or
            (request.user.id if request.user.is_authenticated else None)
        )

        filtro = {'universidadId': universidad_id}
        if comentario_id:
            filtro['id'] = comentario_id
        elif usuario_id:
            filtro['usuarioId'] = usuario_id
        else:
            return Response(
                {'error': "Se requiere 'id' del comentario o 'usuarioId' para eliminar."},
                status=status.HTTP_400_BAD_REQUEST
            )

        eliminados, _ = Comentario.objects.filter(**filtro).delete()
        if eliminados > 0:
            return Response({'detail': 'Comentario eliminado.'}, status=status.HTTP_200_OK)
        return Response({'detail': 'Comentario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
