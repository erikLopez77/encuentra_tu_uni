import os
import time
from openai import OpenAI # Sí, usamos la de OpenAI
from django.core.management.base import BaseCommand
from core.models import Universidad
from dotenv import load_dotenv

load_dotenv()

class Command(BaseCommand):
    help = 'Rellena descripciones usando la API de DeepSeek'

    def handle(self, *args, **options):
        # 1. Configuración del Cliente (Apuntando a DeepSeek)
        client = OpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com" # <--- Punto clave
        )

        universidades = Universidad.objects.filter(descripcion_ia__isnull=True) | \
                        Universidad.objects.filter(descripcion_ia="")

        self.stdout.write(f"Procesando {universidades.count()} universidades con DeepSeek...")

        for uni in universidades:
            try:
                self.stdout.write(f"Generando historia para: {uni.nombre}...")
                
                prompt = f"Escribe una reseña profesional de 3 párrafos sobre la historia y oferta educativa de la {uni.nombre} en {uni.ciudad}, {uni.estado}. Sé formal."

                # Usamos el modelo 'deepseek-chat' (que es el V3 o V4 dependiendo de tu zona)
                response = client.chat.completions.create(
                    model="deepseek-chat", 
                    messages=[
                        {"role": "system", "content": "Eres un experto en universidades mexicanas."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=600,
                    temperature=0.7
                )

                descripcion = response.choices[0].message.content
                
                if descripcion:
                    uni.descripcion_ia = descripcion
                    uni.save()
                    self.stdout.write(self.style.SUCCESS(f"✓ {uni.nombre} guardada."))
                
                # DeepSeek es muy rápido, pero una pausa de 1s ayuda a evitar bloqueos
                time.sleep(1)

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error en {uni.nombre}: {e}"))
                if "insufficient_balance" in str(e).lower():
                    self.stdout.write(self.style.ERROR("¡Necesitas recargar saldo en DeepSeek!"))
                    break