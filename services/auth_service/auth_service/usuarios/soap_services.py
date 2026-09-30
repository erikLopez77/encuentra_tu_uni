"""
Servicio SOAP manual para autenticación - sin dependencia de Spyne.
Usa xml.etree.ElementTree (incluido en Python) para parsear y generar XML.

El flujo es:
1. React manda un POST con un envelope SOAP en XML
2. Esta vista extrae username/password del XML
3. Autentica con Django, llama a login() que guarda la sesión en Redis
4. Devuelve una respuesta SOAP XML con SUCCESS o INVALID_CREDENTIALS
"""

from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
import xml.etree.ElementTree as ET

# Namespaces del envelope SOAP 1.1
NS_SOAP_ENV = 'http://schemas.xmlsoap.org/soap/envelope/'
NS_TNS = 'ssproyecto.auth.soap'  # type: ignore[name-defined]


def _soap_response(result: str) -> HttpResponse:
    """Construye un envelope SOAP de respuesta con el resultado dado."""
    xml_body = f"""<?xml version="1.0" encoding="utf-8"?>
<soap11env:Envelope xmlns:soap11env="{NS_SOAP_ENV}" xmlns:tns="{NS_TNS}">
    <soap11env:Body>
        <tns:authenticate_userResponse>
            <tns:authenticate_userResult>{result}</tns:authenticate_userResult>
        </tns:authenticate_userResponse>
    </soap11env:Body>
</soap11env:Envelope>"""
    return HttpResponse(xml_body, content_type='text/xml; charset=utf-8')


def _soap_fault(message: str) -> HttpResponse:
    """Construye un envelope SOAP de error (Fault)."""
    xml_body = f"""<?xml version="1.0" encoding="utf-8"?>
<soap11env:Envelope xmlns:soap11env="{NS_SOAP_ENV}">
    <soap11env:Body>
        <soap11env:Fault>
            <faultcode>Client</faultcode>
            <faultstring>{message}</faultstring>
        </soap11env:Fault>
    </soap11env:Body>
</soap11env:Envelope>"""
    return HttpResponse(xml_body, content_type='text/xml; charset=utf-8', status=400)


@csrf_exempt
def soap_login_view(request):
    """
    Vista Django que procesa peticiones SOAP de autenticación.
    Acepta GET (devuelve WSDL básico) y POST (procesa login).
    """
    if request.method == 'GET':
        # WSDL mínimo para que el cliente sepa que el servicio existe
        wsdl = f"""<?xml version="1.0" encoding="utf-8"?>
<definitions name="LoginService"
    targetNamespace="{NS_TNS}"
    xmlns="{NS_TNS}"
    xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
    xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/">
    <message name="authenticate_userRequest">
        <part name="username" type="xsd:string"/>
        <part name="password" type="xsd:string"/>
    </message>
    <message name="authenticate_userResponse">
        <part name="result" type="xsd:string"/>
    </message>
    <portType name="LoginServicePortType">
    <!-- agregar la funcion authenticate_user -->
        <operation name="authenticate_user">
            <input message="tns:authenticate_userRequest"/>
            <output message="tns:authenticate_userResponse"/>
        </operation>
    </portType>
</definitions>"""
        return HttpResponse(wsdl, content_type='text/xml; charset=utf-8')

    if request.method == 'OPTIONS':
        # CORS preflight - django-cors-headers lo maneja, pero por si acaso
        response = HttpResponse(status=200)
        return response

    if request.method != 'POST':
        return HttpResponse('Method Not Allowed', status=405)

    # --- Parsear el XML del cuerpo ---
    try:
        root = ET.fromstring(request.body)
    except ET.ParseError as e:
        return _soap_fault(f'XML inválido: {e}')

    # Buscar el elemento authenticate_user dentro del Body
    # Soportamos con y sin namespace en el elemento de la operación
    body_tag = f'{{{NS_SOAP_ENV}}}Body'
    body = root.find(body_tag)
    if body is None:
        return _soap_fault('No se encontró el elemento Body en el envelope SOAP')

    # El elemento de la operación puede tener namespace del TNS o ninguno
    # IMPORTANTE: usar 'is None' explícito porque los Elements XML pueden ser falsy
    op_element = body.find(f'{{{NS_TNS}}}authenticate_user')
    if op_element is None:
        op_element = body.find('authenticate_user')
    if op_element is None:
        # Buscar cualquier hijo del body como fallback
        children = list(body)
        op_element = children[0] if children else None
    if op_element is None:
        return _soap_fault('Operación authenticate_user no encontrada en el Body')

    # Extraer username y password - usar is None explícito
    username_el = op_element.find(f'{{{NS_TNS}}}username')
    if username_el is None:
        username_el = op_element.find('username')

    password_el = op_element.find(f'{{{NS_TNS}}}password')
    if password_el is None:
        password_el = op_element.find('password')

    if username_el is None or password_el is None:
        return _soap_fault('Faltan los campos username o password')

    username = (username_el.text or '').strip()
    password = (password_el.text or '').strip()

    if not username or not password:
        return _soap_response('INVALID_CREDENTIALS')

    # --- Autenticación ---
    # Permitir login con email buscando el username real
    user_by_email = User.objects.filter(email=username).first()
    actual_username = user_by_email.username if user_by_email else username

    user = authenticate(request, username=actual_username, password=password)

    if user is not None:
        # login() crea la sesión => va a Redis por SESSION_ENGINE configurado
        login(request, user)
        return _soap_response('SUCCESS')

    return _soap_response('INVALID_CREDENTIALS')
