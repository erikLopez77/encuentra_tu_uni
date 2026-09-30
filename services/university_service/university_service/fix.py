import json, re

# Nombre del archivo de la fixture
file_path = "universidades.json"

print("Leyendo el archivo...")
with open(file_path, "r", encoding="utf-8") as file:
    content = file.read()

# Reemplaza todas las apariciones de 'core.' por 'universidades.'
# (Maneja tanto minúsculas como mayúsculas por seguridad)
#new_content = content.replace("core.universidad", "universidades.universidad")
#new_content = new_content.replace("core.Universidad", "universidades.Universidad")
#new_content = content.replace('"comentario": []', '')
# Expresión regular para eliminar comas sobrantes antes de un cierre de llave } o corchete ]
new_content = re.sub(r",\s*([\]}])", r"\1", content)
# Guarda el archivo actualizado manteniendo el formato UTF-8 limpio
with open(file_path, "w", encoding="utf-8") as file:
    file.write(new_content)

print("¡Listo! Las referencias a la app 'core' han sido actualizadas a 'universidades'.")