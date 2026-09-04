
-- Alinea las secuencias por si hubo inserts manuales sin actualizar BIGSERIAL.
SELECT setval(pg_get_serial_sequence('usuarios', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM usuarios;
SELECT setval(pg_get_serial_sequence('clientes', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM clientes;
SELECT setval(pg_get_serial_sequence('categorias', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM categorias;
SELECT setval(pg_get_serial_sequence('comentarios', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM comentarios;
SELECT setval(pg_get_serial_sequence('analisis_nlp', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM analisis_nlp;
SELECT setval(pg_get_serial_sequence('tiempos_atencion', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM tiempos_atencion;
SELECT setval(pg_get_serial_sequence('metricas_estadisticas', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM metricas_estadisticas;
SELECT setval(pg_get_serial_sequence('optimizaciones', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM optimizaciones;
SELECT setval(pg_get_serial_sequence('auditoria', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM auditoria;

-- Normaliza únicamente los registros demo creados por este seed.
UPDATE categorias
SET activo = FALSE
WHERE nombre LIKE 'DEMO_%';

UPDATE comentarios
SET procesado = CASE WHEN estado = 'resuelto' THEN TRUE ELSE FALSE END
WHERE contenido LIKE 'Comentario demo %';

UPDATE tiempos_atencion AS tiempos
SET tiempo_minutos = (10 + (demo.serie % 16))::numeric(10, 2)
FROM comentarios AS comentarios
CROSS JOIN LATERAL (
	SELECT regexp_replace(comentarios.contenido, '\D', '', 'g')::integer AS serie
) AS demo
WHERE tiempos.comentario_id = comentarios.id
	AND comentarios.contenido LIKE 'Comentario demo %'
	AND demo.serie BETWEEN 1 AND 100;

UPDATE optimizaciones
SET parametros_entrada = jsonb_build_object(
		'recurso_a', 3 + (substring(optimizaciones.nombre FROM '[0-9]+')::integer % 8),
		'recurso_b', 5 + (substring(optimizaciones.nombre FROM '[0-9]+')::integer % 10)
	),
	resultado = jsonb_build_object(
		'ahorro_porcentual', round((100 + substring(optimizaciones.nombre FROM '[0-9]+')::integer * 2)::numeric / (1000 + substring(optimizaciones.nombre FROM '[0-9]+')::integer * 10) * 100, 2),
		'roi', round((1000 + substring(optimizaciones.nombre FROM '[0-9]+')::integer * 10)::numeric / (900 + substring(optimizaciones.nombre FROM '[0-9]+')::integer * 8), 2)
	),
	costo_inicial = (1000 + substring(optimizaciones.nombre FROM '[0-9]+')::integer * 10)::numeric(14, 4),
	costo_optimizado = (900 + substring(optimizaciones.nombre FROM '[0-9]+')::integer * 8)::numeric(14, 4)
WHERE optimizaciones.nombre LIKE 'Optimización demo %'
	AND substring(optimizaciones.nombre FROM '[0-9]+')::integer BETWEEN 1 AND 100;

INSERT INTO categorias (nombre, descripcion)
VALUES
	('VENTAS', 'Consultas y oportunidades comerciales'),
	('SOPORTE', 'Ayuda técnica y resolución de incidencias'),
	('RECLAMO', 'Quejas o incidencias reportadas por clientes'),
	('CONSULTA', 'Solicitudes generales de información'),
	('FELICITACION', 'Reconocimientos positivos al servicio'),
	('OTROS', 'Comentarios que no encajan en otra categoría')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO clientes (nombre, email, empresa)
SELECT datos.nombre, datos.email, datos.empresa
FROM (VALUES
	('Ana Gómez', 'ana@apex.com', 'Apex Soluciones'),
	('Mateo Ruiz', 'mateo@logiscenter.com', 'LogisCenter'),
	('Sofía Torres', 'sofia@nexa.com', 'Nexa Retail'),
	('Diego Pérez', 'diego@bluewave.com', 'BlueWave'),
	('Carmen Ríos', 'carmen@mediclinic.com', 'MediClinic')
) AS datos(nombre, email, empresa)
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE clientes.email = datos.email);

INSERT INTO comentarios (cliente_id, contenido, canal, estado, categoria, procesado)
SELECT clientes.id, datos.contenido, datos.canal, 'resuelto', datos.categoria, TRUE
FROM (VALUES
	('ana@apex.com', 'El servicio fue rápido y amable.', 'email', 'FELICITACION'),
	('mateo@logiscenter.com', 'Necesito una actualización del proceso de soporte.', 'chat', 'CONSULTA'),
	('sofia@nexa.com', 'El pedido llegó con retraso y la atención fue lenta.', 'whatsapp', 'RECLAMO'),
	('diego@bluewave.com', 'Muy buena atención comercial y opciones claras.', 'web', 'VENTAS'),
	('carmen@mediclinic.com', 'El equipo solucionó mi incidencia rápidamente.', 'portal', 'SOPORTE')
) AS datos(email, contenido, canal, categoria)
JOIN clientes ON clientes.email = datos.email
WHERE NOT EXISTS (SELECT 1 FROM comentarios WHERE comentarios.contenido = datos.contenido);

INSERT INTO tiempos_atencion (cliente_id, comentario_id, tiempo_minutos, operador)
SELECT comentarios.cliente_id, comentarios.id, datos.minutos, 'Seed'
FROM (VALUES
	('El servicio fue rápido y amable.', 12.0),
	('Necesito una actualización del proceso de soporte.', 21.0),
	('El pedido llegó con retraso y la atención fue lenta.', 34.0),
	('Muy buena atención comercial y opciones claras.', 15.0),
	('El equipo solucionó mi incidencia rápidamente.', 10.0)
) AS datos(contenido, minutos)
JOIN comentarios ON comentarios.contenido = datos.contenido
WHERE NOT EXISTS (SELECT 1 FROM tiempos_atencion WHERE tiempos_atencion.comentario_id = comentarios.id);

INSERT INTO analisis_nlp (comentario_id, idioma, cantidad_palabras, palabras_limpias, palabras_frecuentes, categoria_detectada, confianza)
SELECT comentarios.id, 'es', datos.cantidad, datos.palabras, datos.frecuentes, comentarios.categoria, 0.95
FROM (VALUES
	('El servicio fue rápido y amable.', 6, '["servicio", "rápido", "amable"]'::jsonb, '["servicio", "rápido", "amable"]'::jsonb),
	('Necesito una actualización del proceso de soporte.', 8, '["necesito", "actualización", "proceso", "soporte"]'::jsonb, '["soporte", "proceso"]'::jsonb),
	('El pedido llegó con retraso y la atención fue lenta.', 9, '["pedido", "llegó", "retraso", "atención", "lenta"]'::jsonb, '["atención", "retraso"]'::jsonb),
	('Muy buena atención comercial y opciones claras.', 7, '["buena", "atención", "comercial", "opciones", "claras"]'::jsonb, '["atención", "comercial"]'::jsonb),
	('El equipo solucionó mi incidencia rápidamente.', 7, '["equipo", "solucionó", "incidencia", "rápidamente"]'::jsonb, '["equipo", "incidencia"]'::jsonb)
) AS datos(contenido, cantidad, palabras, frecuentes)
JOIN comentarios ON comentarios.contenido = datos.contenido
WHERE NOT EXISTS (SELECT 1 FROM analisis_nlp WHERE analisis_nlp.comentario_id = comentarios.id);

-- Datos de demostración adicionales: 100 registros por tabla.
INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
SELECT 'Usuario demo ' || serie,
	   'demo.usuario.' || serie || '@example.com',
	   'demo-password-hash',
	   (ARRAY['USUARIO', 'ANALISTA', 'SUPERVISOR'])[1 + (serie % 3)],
	   serie % 10 <> 0
FROM generate_series(1, 100) AS datos(serie)
WHERE NOT EXISTS (
	SELECT 1 FROM usuarios WHERE usuarios.email = 'demo.usuario.' || datos.serie || '@example.com'
);

INSERT INTO clientes (nombre, email, telefono, empresa, activo)
SELECT 'Cliente demo ' || serie,
	   'demo.cliente.' || serie || '@example.com',
	   '+34 600 ' || lpad(serie::text, 6, '0'),
	   'Empresa demo ' || ((serie - 1) % 20 + 1),
	   serie % 10 <> 0
FROM generate_series(1, 100) AS datos(serie)
WHERE NOT EXISTS (
	SELECT 1 FROM clientes WHERE clientes.email = 'demo.cliente.' || datos.serie || '@example.com'
);

INSERT INTO comentarios (cliente_id, contenido, canal, estado, categoria, fecha, procesado)
SELECT (
		   SELECT id FROM clientes
		   WHERE email = 'demo.cliente.' || serie || '@example.com'
	   ),
	   'Comentario demo ' || serie || ': seguimiento de atención y servicio.',
	   (ARRAY['web', 'email', 'chat', 'whatsapp'])[1 + (serie % 4)],
	   (ARRAY['pendiente', 'en_proceso', 'resuelto', 'cancelado'])[1 + (serie % 4)],
	   (ARRAY['SOPORTE', 'VENTAS', 'RECLAMO', 'FELICITACION', 'CONSULTA'])[1 + (serie % 5)],
	   NOW() - (serie || ' hours')::interval,
	   serie % 4 <> 0
FROM generate_series(1, 100) AS datos(serie)
WHERE NOT EXISTS (
	SELECT 1 FROM comentarios
	WHERE comentarios.contenido = 'Comentario demo ' || datos.serie || ': seguimiento de atención y servicio.'
);

INSERT INTO analisis_nlp (
	comentario_id, idioma, cantidad_palabras, palabras_limpias,
	palabras_frecuentes, categoria_detectada, confianza
)
SELECT comentarios.id,
	   'es',
	   9,
	   jsonb_build_array('comentario', 'demo', serie::text, 'atencion', 'servicio'),
	   jsonb_build_array('atencion', 'servicio'),
	   comentarios.categoria,
	   0.9500
FROM generate_series(1, 100) AS datos(serie)
JOIN comentarios ON comentarios.contenido = 'Comentario demo ' || serie || ': seguimiento de atención y servicio.'
WHERE NOT EXISTS (
	SELECT 1 FROM analisis_nlp WHERE analisis_nlp.comentario_id = comentarios.id
);

INSERT INTO tiempos_atencion (cliente_id, comentario_id, tiempo_minutos, fecha, operador)
SELECT comentarios.cliente_id,
	   comentarios.id,
	   (10 + (serie % 16))::numeric(10, 2),
	   CURRENT_DATE - (serie % 30),
	   'Operador demo ' || ((serie - 1) % 10 + 1)
FROM generate_series(1, 100) AS datos(serie)
JOIN comentarios ON comentarios.contenido = 'Comentario demo ' || serie || ': seguimiento de atención y servicio.'
WHERE NOT EXISTS (
	SELECT 1 FROM tiempos_atencion WHERE tiempos_atencion.comentario_id = comentarios.id
);

INSERT INTO metricas_estadisticas (
	fecha_inicio, fecha_fin, cantidad_registros, media, mediana,
	desviacion_estandar, minimo, maximo, percentil_25, percentil_75
)
SELECT CURRENT_DATE - serie,
	   CURRENT_DATE - serie,
	   10 + (serie % 21),
	   (15 + (serie % 10) * 0.7)::numeric(12, 4),
	   (14 + (serie % 10) * 0.7)::numeric(12, 4),
	   (1.5 + (serie % 8) * 0.35)::numeric(12, 4),
	   8 + (serie % 5),
	   30 + (serie % 16),
	   (9 + (serie % 8) * 0.4)::numeric(12, 4),
	   (20 + (serie % 8) * 0.5)::numeric(12, 4)
FROM generate_series(1, 100) AS datos(serie)
WHERE NOT EXISTS (
	SELECT 1 FROM metricas_estadisticas
	WHERE metricas_estadisticas.fecha_inicio = CURRENT_DATE - datos.serie
);

INSERT INTO optimizaciones (
	nombre, descripcion, parametros_entrada, resultado,
	costo_inicial, costo_optimizado, estado
)
SELECT 'Optimización demo ' || serie,
	   'Escenario de demostración ' || serie,
	   jsonb_build_object('recurso_a', 3 + (serie % 8), 'recurso_b', 5 + (serie % 10)),
	   jsonb_build_object(
		   'ahorro_porcentual', round((100 + serie * 2)::numeric / (1000 + serie * 10) * 100, 2),
		   'roi', round((1000 + serie * 10)::numeric / (900 + serie * 8), 2)
	   ),
	   (1000 + serie * 10)::numeric(14, 4),
	   (900 + serie * 8)::numeric(14, 4),
	   (ARRAY['pendiente', 'en_proceso', 'completado'])[1 + (serie % 3)]
FROM generate_series(1, 100) AS datos(serie)
WHERE NOT EXISTS (
	SELECT 1 FROM optimizaciones
	WHERE optimizaciones.nombre = 'Optimización demo ' || datos.serie
);

INSERT INTO auditoria (usuario_id, accion, tabla, registro_id, detalles, ip)
SELECT (SELECT id FROM usuarios WHERE email = 'demo.usuario.' || serie || '@example.com'),
	   'DEMO',
	   (ARRAY['usuarios', 'clientes', 'comentarios', 'categorias'])[1 + (serie % 4)],
	   serie,
	   jsonb_build_object('origen', 'seed', 'serie', serie),
	   '127.0.0.1'
FROM generate_series(1, 100) AS datos(serie)
WHERE NOT EXISTS (
	SELECT 1 FROM auditoria
	WHERE auditoria.accion = 'DEMO'
	  AND auditoria.detalles ->> 'serie' = datos.serie::text
);
