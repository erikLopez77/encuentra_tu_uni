from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.core.cache import cache
from .models import Comentario, Favorito


class InteractionServiceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        cache.clear()

    # ── PRUEBAS DE FAVORITOS (GET, POST, DELETE en /favoritos/) ─────────

    def test_crear_favorito(self):
        url = reverse('favoritos')
        data = {'universidadId': 10, 'usuarioId': 1}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Favorito.objects.count(), 1)
        self.assertEqual(Favorito.objects.first().universidadId, 10)

    def test_crear_favorito_duplicado(self):
        Favorito.objects.create(universidadId=10, usuarioId=1)
        url = reverse('favoritos')
        data = {'universidadId': 10, 'usuarioId': 1}
        response = self.client.post(url, data, format='json')
        # get_or_create responde 200 OK si ya existía
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Favorito.objects.count(), 1)

    def test_consultar_favoritos_con_cache(self):
        Favorito.objects.create(universidadId=1, usuarioId=1)
        Favorito.objects.create(universidadId=2, usuarioId=1)

        url = reverse('favoritos')
        # Primera consulta: lee de DB y guarda en caché
        res1 = self.client.get(f"{url}?usuarioId=1")
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data.get('origen'), 'database')
        self.assertEqual(res1.data.get('favoritos'), [1, 2])

        # Segunda consulta: lee de caché
        res2 = self.client.get(f"{url}?usuarioId=1")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data.get('origen'), 'cache')
        self.assertEqual(res2.data.get('favoritos'), [1, 2])

    def test_eliminar_favorito_e_invalida_cache(self):
        Favorito.objects.create(universidadId=5, usuarioId=1)
        url = reverse('favoritos')

        # Cachear
        self.client.get(f"{url}?usuarioId=1")
        self.assertIsNotNone(cache.get("favoritos_user_1"))

        # Eliminar
        response = self.client.delete(url, {'universidadId': 5, 'usuarioId': 1}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Favorito.objects.count(), 0)
        # La clave en caché debió ser invalidada
        self.assertIsNone(cache.get("favoritos_user_1"))

    # ── PRUEBAS DE COMENTARIOS (CRUD en /universidades/:id/comentarios/) ─

    def test_crear_comentario_en_universidad(self):
        url = reverse('universidad-comentarios', kwargs={'universidad_id': 4})
        data = {
            'usuarioId': 1,
            'texto': 'Excelente universidad, muy buenos profesores.',
            'calificacion': 5
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comentario.objects.count(), 1)
        comentario = Comentario.objects.first()
        self.assertEqual(comentario.universidadId, 4)
        self.assertEqual(comentario.usuarioId, 1)

    def test_listar_comentarios_de_universidad(self):
        Comentario.objects.create(universidadId=1, usuarioId=1, texto="Buena", calificacion=4)
        Comentario.objects.create(universidadId=1, usuarioId=2, texto="Genial", calificacion=5)
        Comentario.objects.create(universidadId=2, usuarioId=1, texto="Regular", calificacion=3)

        url = reverse('universidad-comentarios', kwargs={'universidad_id': 1})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_actualizar_comentario(self):
        Comentario.objects.create(
            universidadId=1,
            usuarioId=1,
            texto="Comentario inicial",
            calificacion=3
        )
        url = reverse('universidad-comentarios', kwargs={'universidad_id': 1})
        data = {
            'usuarioId': 1,
            'texto': 'Comentario modificado',
            'calificacion': 5
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        comentario = Comentario.objects.get(universidadId=1, usuarioId=1)
        self.assertEqual(comentario.texto, 'Comentario modificado')
        self.assertEqual(comentario.calificacion, 5)

    def test_eliminar_comentario(self):
        Comentario.objects.create(
            universidadId=1,
            usuarioId=1,
            texto="Por borrar",
            calificacion=2
        )
        url = reverse('universidad-comentarios', kwargs={'universidad_id': 1})
        response = self.client.delete(f"{url}?usuarioId=1")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Comentario.objects.count(), 0)
