import os
import time
import requests
from google import genai  # Nueva librería
from django.core.management.base import BaseCommand
from core.models import Universidad
from dotenv import load_dotenv

load_dotenv()

class Command(BaseCommand):
    help = 'Completa teléfono, sitio oficial e historia de las universidades'

    def handle(self, *args, **options):
        # 1. Configuración del Nuevo Cliente de Google
        # El cliente busca automáticamente la variable GEMINI_API_KEY en el .env
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        GOOGLE_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

        # 2. Buscamos las que les falte descripción O teléfono O sitio web
        universidades = Universidad.objects.filter(
            descripcion_ia__isnull=True
        ) | Universidad.objects.filter(telefono__isnull=True) | Universidad.objects.filter(sitio_oficial__isnull=True)

        self.stdout.write(f"Procesando {universidades.count()} universidades...")

        for uni in universidades:
            try:
                # 1. OBTENER Y GUARDAR DATOS DE GOOGLE MAPS PRIMERO
                if not uni.telefono or not uni.sitio_oficial:
                    self.stdout.write(f"Buscando Maps para: {uni.nombre}")
                    details_url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={uni.google_place_id}&fields=international_phone_number,website,url&key={GOOGLE_KEY}"
                    res = requests.get(details_url).json().get('result', {})
                    
                    if res:
                        uni.telefono = res.get('international_phone_number', uni.telefono)
                        uni.sitio_oficial = res.get('website', uni.sitio_oficial)
                        uni.google_maps_url = res.get('url', uni.google_maps_url)
                        # GUARDADO INMEDIATO: Aunque la IA falle, esto ya se queda en la DB
                        uni.save() 

                # 2. INTENTAR IA (Con un solo reintento para no perder tiempo)
                if not uni.descripcion_ia or len(uni.descripcion_ia) < 20:
                    self.stdout.write(f"Generando historia para: {uni.nombre}")
                    try:
                        response_ai = client.models.generate_content(
                            model="gemini-3.1-flash-lite-preview", 
                            contents = f"Escribe una reseña profesional de 3 párrafos sobre la {uni.nombre} en {uni.ciudad}, {uni.estado}. Enfócate en su historia y oferta educativa."
                        )
                        uni.descripcion_ia = response_ai.text
                        uni.save()
                        time.sleep(5) # Pausa para no quemar la cuota
                    except Exception as ai_e:
                        if "429" in str(ai_e):
                            self.stdout.write(self.style.WARNING(f"⚠️ Saltando IA para {uni.nombre} por cuota. Se intentará en la siguiente vuelta."))
                            continue # Pasa a la siguiente universidad

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error en {uni.nombre}: {e}"))