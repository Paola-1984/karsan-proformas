-- 1. TABLA DE MARCAS (Escuela vs Agencia)
CREATE TABLE marcas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    logo_url VARCHAR(255),
    color_primario VARCHAR(10) DEFAULT '#1BA0D8',
    color_secundario VARCHAR(10) DEFAULT '#14213D',
    correo_remitente VARCHAR(150) NOT NULL,
    prefijo_correlativo VARCHAR(10) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE USUARIOS (Admin y Asesor)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marca_id INT NULL,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'ASESOR') DEFAULT 'ASESOR',
    FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE SET NULL
);

-- 3. TABLA DE CLIENTES
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_razon_social VARCHAR(150) NOT NULL,
    identificacion VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    ciudad VARCHAR(100),
    tipo_cliente ENUM('NATURAL', 'EMPRESA') DEFAULT 'NATURAL',
    sector VARCHAR(100),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA DE CATÁLOGO / SERVICIOS
CREATE TABLE servicios_catalogo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marca_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2) NOT NULL,
    aplica_iva BOOLEAN DEFAULT TRUE,
    es_editable BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (marca_id) REFERENCES marcas(id)
);

-- 5. TABLA ENCABEZADO DE PROFORMAS
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

-- 6. TABLA DETALLE DE PROFORMA
CREATE TABLE proforma_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proforma_id INT NOT NULL,
    servicio_id INT NULL,
    descripcion_custom TEXT NOT NULL,
    cantidad INT DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento_linea DECIMAL(10,2) DEFAULT 0.00,
    subtotal_linea DECIMAL(10,2) NOT NULL,
    aplica_iva BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (proforma_id) REFERENCES proformas(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios_catalogo(id) ON DELETE SET NULL
);