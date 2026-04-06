import os
import requests
import time # nos brinda retraso entre páginas
from django.core.management.base import BaseCommand
from core.models import Universidad
from dotenv import load_dotenv

load_dotenv()

class Command(BaseCommand):
    help = 'Puebla la base de datos con hasta 60 universidades por ciudad usando paginación'

    def handle(self, *args, **options):
        API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')

        if not API_KEY:
            self.stdout.write(self.style.ERROR("No se encontró la API KEY en .env"))
            return

        ciudades_busqueda = [
            "Ciudad de Mexico", "Guadalajara", "Monterrey", "Puebla", 
            "Queretaro", "Merida", "Leon", "San Luis Potosi", "Tijuana"
        ]
        
        for ciudad in ciudades_busqueda:
            self.stdout.write(self.style.NOTICE(f"\n--- Iniciando búsqueda en: {ciudad} ---"))
            
            url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query=universidades+en+{ciudad}&key={API_KEY}"
            next_page_token = None

            while True:
                # Si tenemos un token de página siguiente, lo añadimos a la URL
                current_url = url
                if next_page_token:
                    current_url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken={next_page_token}&key={API_KEY}"
                    # Google pide esperar un poco antes de usar el token
                    time.sleep(2)

                try:
                    response = requests.get(current_url).json()
                    status = response.get('status')

                    if status != 'OK' and status != 'ZERO_RESULTS':
                        self.stdout.write(self.style.ERROR(f"Error de Google ({status}): {response.get('error_message', '')}"))
                        break

                    results = response.get('results', [])
                    for res in results:
                        nombre = res.get('name')
                        place_id = res.get('place_id')
                        
                        # Evitamos procesar cosas que no sean escuelas (filtros básicos)
                        if any(word in nombre.upper() for word in ["KARAOKE", "RESTAURANTE", "HOTEL"]):
                            continue
                        photos = res.get('photos', [])
                        foto_ref = photos[0].get('photo_reference') if photos else None
                        direccion = res.get('formatted_address', '')
                        partes_dir = direccion.split(',')
                        estado = partes_dir[-3].strip() if len(partes_dir) >= 3 else ciudad
           
                        obj, created = Universidad.objects.update_or_create(
                            google_place_id=place_id,
                            defaults={
                                'nombre': nombre,
                                'estado': estado,
                                'ciudad': ciudad,
                                'rating_google': res.get('rating', 0.0),
                                'tipo': 'PUB' if any(x in nombre.upper() for x in ['AUTÓNOMA', 'POLITÉCNICO', 'PÚBLICA', 'FEDERAL']) else 'PRI',
                                'sitio_web': f"https://www.google.com/maps/place/?q=place_id:{place_id}",
                                'foto_reference': foto_ref,
                            }
                        )
                        
                        if created:
                            self.stdout.write(self.style.SUCCESS(f"  [NUEVA] {nombre}"))

                    # Verificamos si hay una página más (máximo 3 páginas de 20 resultados)
                    next_page_token = response.get('next_page_token')
                    if not next_page_token:
                        break # No hay más resultados para esta ciudad
                    
                    self.stdout.write(f"  Cargando siguiente página para {ciudad}...")

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error: {e}"))
                    break

        self.stdout.write(self.style.SUCCESS("\n¡Importación masiva completada con éxito!"))