-- ============================================
-- SISTEMA DE PROFORMAS KARSAN
-- Marcas operativas: Karsan Escuela Digital (ESC) y Dr. BACH (AG)
-- ============================================

-- 1. TABLA DE MARCAS (Escuela vs Agencia)
CREATE TABLE marcas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    logo_url VARCHAR(255),
    color_primario VARCHAR(10) NOT NULL,
    color_secundario VARCHAR(10) NOT NULL,
    correo_remitente VARCHAR(150) NOT NULL,
    prefijo_correlativo VARCHAR(10) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    telefono VARCHAR(20) NULL,
    whatsapp VARCHAR(20) NULL,
    sitio_web VARCHAR(255) NULL,
    facebook_url VARCHAR(255) NULL,
    instagram_url VARCHAR(255) NULL,
    tiktok_url VARCHAR(255) NULL,
    linkedin_url VARCHAR(255) NULL
);

-- 2. TABLA DE USUARIOS (Admin y Asesor)
-- marca_id NULL = Admin con acceso a TODAS las marcas (Karsan corporativo)
-- marca_id con valor = usuario restringido a esa marca únicamente
-- descuento_max_permitido = tope de descuento que puede aplicar ese usuario en proformas
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marca_id INT NULL,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'ASESOR') DEFAULT 'ASESOR',
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descuento_max_permitido DECIMAL(5,2) DEFAULT 10.00,
    FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE SET NULL
);

-- 3. TABLA DE CLIENTES
-- identificacion es UNIQUE para evitar duplicar clientes y mantener historial real
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_razon_social VARCHAR(150) NOT NULL,
    identificacion VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    ciudad VARCHAR(100),
    tipo_cliente ENUM('NATURAL', 'EMPRESA') DEFAULT 'NATURAL',
    sector VARCHAR(100),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA DE CATÁLOGO / SERVICIOS
-- iva_porcentaje reemplaza el booleano: 0.00 = exento (ej. cursos en el exterior), 15.00 = estándar
-- precio_plan_anual + precio_plan_trimestral, O precio_unico — nunca los tres a la vez
-- fecha_inicio_curso = default de vencimiento para proformas de Escuela (sobreescribible por proforma)
CREATE TABLE servicios_catalogo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marca_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2) NOT NULL,
    iva_porcentaje DECIMAL(5,2) DEFAULT 15.00,
    es_editable BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    precio_plan_anual DECIMAL(10,2) NULL,
    precio_plan_trimestral DECIMAL(10,2) NULL,
    precio_unico DECIMAL(10,2) NULL,
    categoria VARCHAR(100) NULL,
    fecha_inicio_curso DATE NULL,
    FOREIGN KEY (marca_id) REFERENCES marcas(id)
);

-- 5. TABLA DE PORTAFOLIO / TRABAJOS DESTACADOS (galería visual en la proforma)
CREATE TABLE portafolio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marca_id INT NOT NULL,
    titulo VARCHAR(150),
    descripcion TEXT,
    iframe_embed TEXT NOT NULL,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (marca_id) REFERENCES marcas(id)
);

-- 6. PARÁMETROS DE PROYECCIÓN / ESTADÍSTICAS (sección "qué generarías si nos eliges")
CREATE TABLE proyeccion_parametros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    servicio_id INT NOT NULL,
    metrica VARCHAR(100) NOT NULL,
    valor_estimado DECIMAL(10,2) NOT NULL,
    unidad VARCHAR(50),
    FOREIGN KEY (servicio_id) REFERENCES servicios_catalogo(id) ON DELETE CASCADE
);

-- 7. TABLA ENCABEZADO DE PROFORMAS
CREATE TABLE proformas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marca_id INT NOT NULL,
    cliente_id INT NOT NULL,
    usuario_id INT NOT NULL,
    numero_correlativo VARCHAR(20) UNIQUE NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    descuento_general DECIMAL(10,2) DEFAULT 0.00,
    monto_iva DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('ENVIADA', 'VISTA', 'ACEPTADA', 'RECHAZADA', 'VENCIDA') DEFAULT 'ENVIADA',
    condiciones_pago TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (marca_id) REFERENCES marcas(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- 8. TABLA DETALLE DE PROFORMA
CREATE TABLE proforma_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proforma_id INT NOT NULL,
    servicio_id INT NULL,
    descripcion_custom TEXT NOT NULL,
    cantidad INT DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento_linea DECIMAL(10,2) DEFAULT 0.00,
    subtotal_linea DECIMAL(10,2) NOT NULL,
    iva_porcentaje DECIMAL(5,2) DEFAULT 15.00,
    FOREIGN KEY (proforma_id) REFERENCES proformas(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios_catalogo(id) ON DELETE SET NULL
);

-- ============================================
-- ÍNDICES (para las consultas más frecuentes del panel)
-- ============================================
CREATE INDEX idx_proformas_marca_estado ON proformas(marca_id, estado);
CREATE INDEX idx_proformas_cliente ON proformas(cliente_id);
CREATE INDEX idx_catalogo_marca_activo ON servicios_catalogo(marca_id, activo);
CREATE INDEX idx_portafolio_marca ON portafolio(marca_id, activo);

-- ============================================
-- DATOS INICIALES: las 2 marcas operativas confirmadas
-- ============================================
INSERT INTO marcas (nombre, slug, logo_url, color_primario, color_secundario, correo_remitente, prefijo_correlativo)
VALUES 
('Karsan Escuela Digital', 'escuela', '/logos/escuela/completo.png', '#274478', '#E9DE19', 'comercial@karsandigital.com', 'ESC'),
('Dr. BACH', 'bach', '/logos/bach/completo_negro.png', '#000000', '#C18A30', 'pendiente@bachagencia.com', 'AG'); -- actualizar correo cuando confirmen dominio