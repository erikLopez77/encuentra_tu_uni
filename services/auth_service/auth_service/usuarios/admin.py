from django.contrib import admin

from .models import OutboxEvento


@admin.register(OutboxEvento)
class OutboxEventoAdmin(admin.ModelAdmin):
    list_display = ('id', 'routing_key', 'enviado', 'intentos', 'creado_en', 'enviado_en')
    list_filter = ('enviado', 'routing_key')
    readonly_fields = ('creado_en', 'enviado_en', 'payload', 'ultimo_error')
    ordering = ('-creado_en',)
    search_fields = ('routing_key',)
