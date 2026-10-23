from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import Universidad


class UniversityServiceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.uni1 = Universidad.objects.create(
            nombre="Universidad Nacional",
            estado="Ciudad de México",
            ciudad="CDMX",
            tipo="PUB",
            rating_google=4.8
        )
        self.uni2 = Universidad.objects.create(
            nombre="Instituto Tecnológico",
            estado="Nuevo León",
            ciudad="Monterrey",
            tipo="PRI",
            rating_google=4.5
        )

    def test_health_check_endpoint(self):
        url = reverse('health-check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json().get('status'), 'healthy')

    def test_health_check_root_endpoint(self):
        url = reverse('health-check-root')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json().get('status'), 'healthy')

    def test_listar_universidades(self):
        url = reverse('universidad-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)

    def test_filtrar_universidades_por_tipo(self):
        url = reverse('universidad-list')
        response = self.client.get(f"{url}?tipo=PUB")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['nombre'], "Universidad Nacional")

    def test_detalle_universidad(self):
        url = reverse('universidad-detail', kwargs={'pk': self.uni1.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nombre'], "Universidad Nacional")
