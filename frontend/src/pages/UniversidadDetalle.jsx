import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

// Lee el token CSRF de la cookie que Django pone al hacer GET /api/perfil/
const getCsrf = () => {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
};

// ── Filtro de contenido inapropiado (espejo del backend) ──────────────────
const PALABRAS_PROHIBIDAS = [
  'pendejo','pendeja','pendejos','pendejas','pendejada','pendejadas',
  'cabron','cabrona','cabrones','cabronas',
  'puto','puta','putos','putas','putada','putazo','putazos',
  'chinga','chingada','chingado','chingadera','chingaderas','chingon','chingona',
  'pinche','pinches',
  'culero','culera','culeros','culeras','culo','culos',
  'mamon','mamona','mamones',
  'joto','jota','jotos',
  'verga','vergon','vergona','vergazo',
  'cono','mierda','mierdas',
  'idiota','idiotas','imbecil','imbeciles',
  'estupido','estupida','estupidos','estupidas',
  'ojete','ojetes','zorra','zorras',
  'maricon','maricona','maricones','marica',
  'bastardo','bastarda','bastardos','bastardas',
  'gilipollas','hdp','hjdp',
  'malparido','malparida',
  'mugroso','mugrosa','mugrosos','mugrosas',
  'mayate','mayates','putear','puteo',
  'weon','wea','huevon','huevona',
  'maldito','maldita','malditos','malditas',
];

const normalizar = (texto) =>
  texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const tienePalabrasProhibidas = (texto) => {
  const norm = normalizar(texto);
  return PALABRAS_PROHIBIDAS.some((p) =>
    new RegExp(`\\b${p}\\b`).test(norm)
  );
};
// ─────────────────────────────────────────────────────────────────────────────

/* ─── Componente de estrellas interactivas ─────────────────────────── */
const StarRating = ({ value, onChange, readOnly = false }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => !readOnly && onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          style={{
            fontSize: readOnly ? '16px' : '24px',
            cursor: readOnly ? 'default' : 'pointer',
            color: star <= (hovered || value) ? '#f59e0b' : '#d1d5db',
            transition: 'color 0.15s',
            userSelect: 'none',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
};

/* ─── Componente tarjeta de comentario ────────────────────────────── */
const ComentarioCard = ({ comentario }) => {
  const fecha = new Date(comentario.fecha).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const iniciales = (comentario.autor_nombre || '?')[0].toUpperCase();

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '16px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      marginBottom: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        {/* Avatar */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: '700', fontSize: '14px', flexShrink: 0,
        }}>
          {iniciales}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: '600', fontSize: '14px', color: '#111827', margin: 0 }}>
            {comentario.autor_nombre}
          </p>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{fecha}</p>
        </div>
        <StarRating value={comentario.calificacion} readOnly />
      </div>
      <p style={{
        color: '#374151', fontSize: '14px', lineHeight: '1.6',
        margin: 0, wordBreak: 'break-word',
      }}>
        {comentario.texto}
      </p>
    </div>
  );
};

/* ─── Panel de comentarios ────────────────────────────────────────── */
const PanelComentarios = ({ universidadId }) => {
  const [comentarios, setComentarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [sesionActiva, setSesionActiva] = useState(false);
  const [texto, setTexto] = useState('');
  const [calificacion, setCalificacion] = useState(5);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [yaComento, setYaComento] = useState(false);
  const [usuarioId, setUsuarioId] = useState(null);

  const cargarComentarios = useCallback(async () => {
    try {
      const res = await axios.get(`/api/universidades/${universidadId}/comentarios/`);
      // DRF puede devolver { results: [...] } si hay paginación, o un array directo
      const data = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      setComentarios(data);
    } catch {
      setComentarios([]);
    } finally {
      setCargando(false);
    }
  }, [universidadId]);

  // Verificar si hay sesión activa
  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const res = await axios.get('/api/perfil/');
        setSesionActiva(true);
        setUsuarioId(res.data.id);
      } catch {
        setSesionActiva(false);
      }
    };
    verificarSesion();
    cargarComentarios();
  }, [cargarComentarios]);

  // Detectar si el usuario ya comentó
  useEffect(() => {
    if (usuarioId && comentarios.length > 0) {
      const tuvo = comentarios.some((c) => c.autor_id === usuarioId);
      setYaComento(tuvo);
      if (tuvo) {
        const miComentario = comentarios.find((c) => c.autor_id === usuarioId);
        if (miComentario && !texto) {
          setTexto(miComentario.texto);
          setCalificacion(miComentario.calificacion);
        }
      }
    }
  }, [comentarios, usuarioId]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) { setError('Escribe algo antes de enviar.'); return; }

    // Validación inmediata en el cliente antes de enviar al servidor
    if (tienePalabrasProhibidas(texto)) {
      setError('Tu comentario contiene lenguaje inapropiado. Por favor mantén un tono respetuoso.');
      return;
    }

    setEnviando(true);
    setError('');
    try {
      await axios.post(`/api/universidades/${universidadId}/comentarios/`, {
        texto: texto.trim(),
        calificacion,
      },
        {
          withCredentials: true,
          headers: { 'X-CSRFToken': getCsrf() }
        });
      await cargarComentarios();
      setYaComento(true);
    } catch (err) {
      // Muestra el error exacto que devuelve el backend (campo 'texto' o 'detail')
      const data = err.response?.data;
      const msg = data?.texto?.[0] || data?.detail || data?.non_field_errors?.[0]
                  || 'Error al enviar. Intenta de nuevo.';
      setError(msg);
    } finally {
      setEnviando(false);
    }
  };

  const promedioCalif = comentarios.length > 0
    ? (comentarios.reduce((acc, c) => acc + c.calificacion, 0) / comentarios.length).toFixed(1)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Encabezado del panel */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid #e5e7eb',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        borderRadius: '24px 24px 0 0',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
          💬 Opiniones de la comunidad
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            {comentarios.length} {comentarios.length === 1 ? 'reseña' : 'reseñas'}
          </span>
          {promedioCalif && (
            <>
              <span style={{ color: '#cbd5e1' }}>·</span>
              <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '700' }}>
                ★ {promedioCalif} promedio
              </span>
            </>
          )}
        </div>
      </div>

      {/* Formulario (solo logueados) */}
      {sesionActiva && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          background: '#fafafa',
        }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 10px' }}>
            {yaComento ? '✏️ Edita tu reseña' : '✍️ Escribe tu reseña'}
          </p>
          <form onSubmit={handleEnviar}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                Calificación
              </label>
              <StarRating value={calificacion} onChange={setCalificacion} />
            </div>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Comparte tu experiencia con esta universidad..."
              maxLength={600}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1.5px solid #d1d5db',
                fontSize: '13px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                background: '#fff',
                color: '#111827',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
              onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{texto.length}/600</span>
              <button
                type="submit"
                disabled={enviando}
                style={{
                  background: enviando ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: enviando ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                }}
              >
                {enviando ? 'Enviando...' : yaComento ? 'Actualizar' : 'Publicar'}
              </button>
            </div>
            {error && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', margin: '6px 0 0' }}>{error}</p>
            )}
          </form>
        </div>
      )}

      {/* CTA para no logueados */}
      {!sesionActiva && (
        <div style={{
          padding: '14px 20px',
          background: '#fffbeb',
          borderBottom: '1px solid #fde68a',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '20px' }}>🔒</span>
          <p style={{ color: '#92400e', fontSize: '13px', margin: 0, flex: 1 }}>
            <Link to="/login" style={{ color: '#d97706', fontWeight: '700', textDecoration: 'none' }}>
              Inicia sesión
            </Link>{' '}
            para dejar tu reseña.
          </p>
        </div>
      )}

      {/* Lista de comentarios */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px',
        maxHeight: '480px',
      }}>
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: '32px', height: '32px', border: '3px solid #e5e7eb',
              borderTopColor: '#3b82f6', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
            }} />
            <p style={{ color: '#9ca3af', fontSize: '13px' }}>Cargando reseñas...</p>
          </div>
        ) : comentarios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '8px' }}>🏫</span>
            <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
              Aún no hay reseñas.
            </p>
            <p style={{ color: '#9ca3af', fontSize: '12px' }}>
              {sesionActiva ? '¡Sé el primero en opinar!' : 'Inicia sesión para escribir la primera.'}
            </p>
          </div>
        ) : (
          comentarios.map((c) => <ComentarioCard key={c.id} comentario={c} />)
        )}
      </div>

      {/* Spinner CSS keyframe inline */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

/* ─── Página principal ────────────────────────────────────────────── */
const UniversidadDetalle = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  useEffect(() => {
    const getDetalle = async () => {
      try {
        const res = await axios.get(`/api/universidades/${id}/`);

        let texto = res.data.descripcion_ia || '';
        texto = texto.replace(/\\n/g, '\n');
        const parrafos = texto.split(/\n+/);

        if (parrafos.length > 1) {
          parrafos.shift();
          texto = parrafos.join('\n\n');
        }

        setData({ ...res.data, descripcion_ia: texto });
      } catch (error) {
        console.error('Error al obtener la universidad', error);
      }
    };
    document.title = 'Universidad | EncuentraTuFuturo';
    getDetalle();
  }, [id]);

  if (!data) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#6b7280', fontSize: '16px', fontWeight: '500' }}>
      Cargando información detallada...
    </div>
  );

  const fotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${data.foto_reference}&key=${API_KEY}`;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', fontFamily: 'inherit' }}>
      {/* Layout de 2 columnas en desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)',
        gap: '24px',
        alignItems: 'start',
      }}
        className="universidad-grid"
      >
        {/* ── Columna Izquierda: Detalle ──────────────────────────── */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
        }}>
          {/* Banner */}
          <div style={{ height: '340px', position: 'relative', background: '#e2e8f0' }}>
            <img
              src={data.foto_reference
                ? fotoUrl
                : 'https://images.unsplash.com/photo-1562774053-701939374585?w=800'}
              alt={data.nombre}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
            }} />
            <div style={{ position: 'absolute', bottom: '16px', left: '20px' }}>
              <span style={{
                background: data.tipo === 'PUB' ? '#2563eb' : '#7c3aed',
                color: '#fff', fontSize: '11px', fontWeight: '800',
                padding: '4px 12px', borderRadius: '999px', letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {data.tipo === 'PUB' ? 'Institución Pública' : 'Institución Privada'}
              </span>
            </div>
          </div>

          {/* Contenido */}
          <div style={{ padding: '28px 28px 32px' }}>
            {/* Encabezado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', lineHeight: 1.2, margin: '0 0 6px' }}>
                  {data.nombre}
                </h1>
                <p style={{ color: '#3b82f6', fontSize: '15px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📍</span> {data.ciudad}, {data.estado}
                </p>
              </div>
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a',
                padding: '12px 16px', borderRadius: '16px', textAlign: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: '28px', color: '#f59e0b', fontWeight: '900', display: 'block' }}>
                  ★ {data.rating_google}
                </span>
                <span style={{ fontSize: '10px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Google Score
                </span>
              </div>
            </div>

            {/* Contacto */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
                Contacto Directo
              </p>
              {data.telefono ? (
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: '600', fontSize: '14px', margin: 0 }}>
                  <span style={{ background: '#fff', padding: '6px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>📞</span>
                  {data.telefono}
                </p>
              ) : (
                <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px', margin: 0 }}>Teléfono no disponible</p>
              )}
            </div>

            {/* Botones principales */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {data.sitio_oficial && (
                <a
                  href={data.sitio_oficial} target="_blank" rel="noreferrer"
                  style={{
                    display: 'block', textAlign: 'center',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
                    color: '#fff', padding: '16px 20px', borderRadius: '14px',
                    fontWeight: '800', fontSize: '15px', textDecoration: 'none',
                    transition: 'background 0.25s, transform 0.15s',
                    boxShadow: '0 4px 14px rgba(15,23,42,0.25)',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  🌐 Ir al Sitio Web Oficial de la Universidad
                </a>
              )}
              {data.google_maps_url && (
                <a
                  href={data.google_maps_url} target="_blank" rel="noreferrer"
                  style={{
                    display: 'block', textAlign: 'center', background: '#fff', color: '#374151',
                    border: '2px solid #e2e8f0', padding: '13px 20px', borderRadius: '14px',
                    fontWeight: '700', fontSize: '14px', textDecoration: 'none',
                    transition: 'border-color 0.2s, color 0.2s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  📍 Ver ubicación en Google Maps
                </a>
              )}
            </div>

            {/* Historia */}
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '4px', height: '22px', background: '#3b82f6', borderRadius: '4px', display: 'inline-block' }} />
                Historia y Trayectoria
              </h2>
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '18px', padding: '20px 22px' }}>
                <p style={{ color: '#334155', lineHeight: '1.75', fontSize: '14px', margin: 0, whiteSpace: 'pre-line', fontStyle: 'italic' }}>
                  {data.descripcion_ia || 'Nuestra inteligencia artificial está compilando la historia de esta universidad. Vuelve en unos minutos.'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', margin: 0 }}>
                Datos actualizados mediante Google Places API y procesados por IA.
              </p>
            </div>
          </div>
        </div>

        {/* ── Columna Derecha: Comentarios ────────────────────────── */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          position: 'sticky',
          top: '24px',
        }}>
          <PanelComentarios universidadId={id} />
        </div>
      </div>

      {/* Responsive: stack en móvil */}
      <style>{`
        @media (max-width: 860px) {
          .universidad-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default UniversidadDetalle;