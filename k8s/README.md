# Kubernetes local con Docker Desktop

Estos manifiestos ejecutan el frontend, el API Gateway, los tres servicios Django, Redis y RabbitMQ en el namespace `encuentra-tu-uni`. Están preparados para desarrollo local; usan `runserver` y la contraseña de RabbitMQ de desarrollo que ya usa `docker-compose.yml`.

## Requisitos

- Docker Desktop iniciado. En **Settings → Kubernetes**, habilita Kubernetes y espera a que el clúster termine de iniciar.
- `kubectl` instalado y el contexto `docker-desktop` seleccionado.

## Construir las imágenes

Desde la raíz del repositorio, construye las mismas imágenes declaradas en `docker-compose.yml`:

```powershell
docker-compose build
```

## Desplegar

```powershell
kubectl config use-context docker-desktop
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/10-stack.yaml
kubectl -n encuentra-tu-uni get pods -w
```

Espera a que los pods estén `Running` y listos. La primera creación puede tardar mientras Kubernetes provisiona los volúmenes y RabbitMQ termina de iniciar.

Cada servicio Django conserva su propia SQLite en un PVC. Un init container copia la base incluida en la imagen al volumen la primera vez; en reinicios posteriores conserva el volumen. Redis y RabbitMQ también tienen almacenamiento persistente. Las aplicaciones quedan con una réplica porque SQLite usa un volumen de acceso único.

## Abrir la aplicación

Si el stack de Docker Compose sigue activo, detenlo desde la raíz del repositorio antes de abrir estos puertos; Compose ya ocupa `5173` y `8000`:

```powershell
docker-compose down
```

Ese comando no elimina el volumen nombrado de Redis. RabbitMQ en Compose no tiene un volumen de datos configurado.

En dos ventanas de PowerShell distintas, desde cualquier carpeta:

```powershell
kubectl -n encuentra-tu-uni port-forward svc/frontend 5173:5173
```

```powershell
kubectl -n encuentra-tu-uni port-forward svc/api-gateway 8000:8000
```

Abre <http://localhost:5173>. El frontend llama al gateway por `http://localhost:8000/api/v1`.

## Diagnóstico y limpieza

```powershell
kubectl -n encuentra-tu-uni get pods,services,pvc
kubectl -n encuentra-tu-uni logs deployment/api-gateway
kubectl -n encuentra-tu-uni describe pod <nombre-del-pod>
```

Para borrar los deployments, servicios y configuración:

```powershell
kubectl delete namespace encuentra-tu-uni
```

Al eliminar el namespace también se eliminan sus PVC; el proveedor de almacenamiento determina si los datos subyacentes se borran o se conservan. La clave y contraseña del manifiesto son únicamente para desarrollo local; cámbialas antes de usar este despliegue fuera de tu laptop.
