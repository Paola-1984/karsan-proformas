````markdown
# Karsan Proformas

Sistema de gestión de cotizaciones comerciales (proformas) para **Karsan Corporación**, empresa de marketing digital y educación con sede en Quito, Ecuador. Administra dos marcas/unidades de negocio con catálogos, reglas de precios y ramas visuales independientes desde una sola base de datos.

- **Cliente / administrador del sistema:** Paola Guachamin
- **Repositorio:** `https://github.com/Paola-1984/karsan-proformas`
- **Rama de trabajo:** `dev`
- **Último commit documentado:** `477b727`

---

## 1. Descripción técnica

El sistema permite:

- Gestionar un catálogo de servicios dinámico por marca, con cuatro modos de precio distintos (fijo, planes anual/trimestral, precio único editable, manual).
- Generar proformas desde un panel administrativo protegido por rol (ADMIN / ASESOR), con descuentos autorizados para asesores.
- Publicar cada proforma como una página web renderizada del lado del servidor (no un PDF estático), con estado en tiempo real (`ENVIADA` → `VISTA` → `ACEPTADA`/`RECHAZADA`/`VENCIDA`).
- Enviar la proforma al cliente por email (enlace + resumen, no como adjunto).
- Mostrar dinámicamente los datos de contacto y redes sociales según la marca cotizada, con iconografía SVG oficial.
- Respetar la identidad visual de cada marca (colores, tipografía, logo) tanto en pantalla como en impresión A4.

### Marcas soportadas

| Marca | Modelo de precio | Notas |
|---|---|---|
| **Karsan Escuela Digital** | Precio fijo / único | Capacitación itinerante, sin dirección física publicable (decisión de negocio) |
| **Dr. BACH** | Plan anual/trimestral o precio único | Nombre comercial en trámite ante el SENADI; datos oficiales bloqueados hasta su resolución |

---

## 2. Arquitectura de archivos

```
karsan-proformas/
├── src/
│   ├── app.js                          # Entry point de Express
│   ├── config/
│   │   └── database.js                 # Pool de conexión MySQL (mysql2)
│   ├── controllers/
│   │   ├── proformasController.js      # Lógica de negocio de proformas (API + panel)
│   │   ├── proformaVistaController.js  # Renderizado HTML público de la proforma
│   │   ├── serviciosController.js      # CRUD del catálogo (servicios_catalogo)
│   │   ├── portafolioController.js     # CRUD de portafolio (iframes embebidos)
│   │   ├── clientesController.js       # CRUD de clientes
│   │   ├── marcasController.js         # Lectura de datos de marca
│   │   └── usuariosController.js       # Login, JWT, descuento máximo por usuario
│   ├── middlewares/
│   │   └── authMiddleware.js           # verificarTokenPanel, soloAdmin
│   └── routes/
│       ├── adminRoutes.js              # Rutas del panel EJS (/admin/*)
│       ├── proformaVistaRoutes.js      # Ruta pública (/proforma/:numero_correlativo)
│       └── ...                         # Rutas de API REST (servicios, clientes, etc.)
├── src/views/
│   └── admin/
│       ├── login.ejs
│       ├── proformas.ejs
│       ├── proforma-form.ejs
│       ├── clientes.ejs
│       ├── cliente-form.ejs
│       ├── servicios.ejs               # Tabla del catálogo (Marca/Categoría/Nombre/Descripción/Tipo/Precio/IVA)
│       ├── servicio-form.ejs
│       ├── portafolio.ejs
│       └── portafolio-form.ejs
├── public/
│   └── logos/
│       ├── escuela/                    # Logos de Karsan Escuela Digital
│       └── bach/                       # Logos de Dr. BACH
├── .env                                # Variables de entorno (NUNCA se commitea)
├── .gitignore
├── README.md
└── package.json
```

---

## 3. Estructura de base de datos (MySQL — `karsan_proformas`)

Tablas: `clientes`, `marcas`, `portafolio`, `proforma_detalles`, `proformas`, `proyeccion_parametros`, `servicios_catalogo`, `usuarios`.

### `servicios_catalogo`

```sql
CREATE TABLE servicios_catalogo (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  marca_id                INT NOT NULL,
  nombre                  VARCHAR(150) NOT NULL,
  descripcion             TEXT,
  precio_base             DECIMAL(10,2) NOT NULL,
  iva_porcentaje          DECIMAL(5,2) DEFAULT 15.00,
  es_editable             TINYINT(1) DEFAULT 0,
  activo                  TINYINT(1) DEFAULT 1,
  creado_en               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  precio_plan_anual       DECIMAL(10,2),
  precio_plan_trimestral  DECIMAL(10,2),
  precio_unico            DECIMAL(10,2),
  categoria               VARCHAR(100),
  fecha_inicio_curso      DATE
);
```

**Reglas de negocio:**
- Cada servicio usa **uno** de estos esquemas de precio, nunca combinados: `precio_unico` solo, **o** (`precio_plan_anual` + `precio_plan_trimestral`) juntos. Un caso especial (`Movilización para grabaciones`) es 100% manual: sin plan ni único.
- `es_editable` **no indica el esquema de precio** — indica si el ASESOR puede editar el precio a mano al armar una proforma. Ambos esquemas de precio (único o plan) pueden coexistir con `es_editable = 1` o `0`. Cualquier lógica que decida qué precio mostrar debe consultar directamente `precio_unico`/`precio_plan_anual`, nunca inferirlo desde `es_editable` (ver sección 7, bug corregido).

### `marcas`

```sql
CREATE TABLE marcas (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  nombre                VARCHAR(100) NOT NULL,
  slug                  VARCHAR(50) NOT NULL UNIQUE,
  logo_url              VARCHAR(255),
  color_primario        VARCHAR(10) NOT NULL,
  color_secundario      VARCHAR(10) NOT NULL,
  correo_remitente      VARCHAR(150) NOT NULL,
  prefijo_correlativo   VARCHAR(10) NOT NULL,
  activo                TINYINT(1) DEFAULT 1,
  creado_en             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  telefono              VARCHAR(20),
  whatsapp              VARCHAR(20),
  sitio_web             VARCHAR(255),
  direccion             VARCHAR(255),
  facebook_url          VARCHAR(255),
  instagram_url         VARCHAR(255),
  tiktok_url            VARCHAR(255),
  linkedin_url          VARCHAR(255)
);
```

### Otras tablas relevantes

- **`clientes`**: datos del cliente cotizado (razón social, identificación, email).
- **`proformas`**: cabecera de cada cotización (número correlativo, marca, cliente, estado, subtotal, descuento general, IVA, total, fechas de emisión/vencimiento, condiciones de pago).
- **`proforma_detalles`**: líneas de servicio de cada proforma (descripción, cantidad, precio unitario, subtotal, IVA aplicado).
- **`portafolio`**: elementos embebidos (iframes de Canva) por marca, con orden y estado activo.
- **`usuarios`**: cuentas del panel (ADMIN / ASESOR), con descuento máximo autorizado por usuario.
- **`proyeccion_parametros`**: parámetros auxiliares de proyección (uso interno, no forma parte del flujo de proformas).

---

## 4. Configuración del entorno local

### 4.1 Variables de entorno (`.env`)

Crear un archivo `.env` en la raíz del proyecto (**nunca commitearlo** — ya está en `.gitignore`):

```
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=karsan_proformas
DB_PORT=3306

# Autenticación
JWT_SECRET=una_clave_secreta_larga_y_aleatoria

# Email (Nodemailer)
EMAIL_USER=karsanproformassistema@gmail.com
EMAIL_APP_PASSWORD=tu_app_password_de_gmail

# Entorno
PORT=3000
APP_BASE_URL=http://localhost:3000   # En producción: la URL pública real (necesario para que los enlaces de email funcionen)
```

### 4.2 Dependencias de Node.js

```json
"dependencies": {
  "bcrypt": "^6.0.0",
  "cookie-parser": "^1.4.7",
  "dotenv": "^17.4.2",
  "ejs": "^6.0.1",
  "express": "^5.2.1",
  "jsonwebtoken": "^9.0.3",
  "mysql2": "^3.23.2",
  "nodemailer": "^9.0.3"
},
"devDependencies": {
  "nodemon": "^3.1.14"
}
```

### 4.3 Git

```
# .gitignore mínimo
node_modules/
.env
```

> **Regla de seguridad permanente:** antes de cada commit, correr `git status` y confirmar que `.env` no aparece en la lista de archivos modificados/nuevos.

---

## 5. Módulos clave

### 5.1 Sistema de proformas

- **Creación:** desde `/admin/proformas/nueva` (ADMIN y ASESOR). El asesor solo ve/opera sobre su `marca_id` asignada; el descuento aplicado no puede superar `descuento_max_permitido` del usuario.
- **Cálculo de precios — `determinarModoPrecio()`:** cuatro modos posibles por servicio: `fijo`, `planes` (anual/trimestral), `unico_editable`, `manual`.
- **Ciclo de vida del estado:** `ENVIADA` → `VISTA` (automático al abrir el enlace por primera vez) → `ACEPTADA` / `RECHAZADA` (acción del cliente) / `VENCIDA` (por fecha).
- **Patrón `adaptarParaPanel()`:** envuelve los controladores de la API (que responden JSON) para que, en el contexto del panel EJS, hagan `redirect` en éxito o muestren el error en texto plano — evita duplicar lógica de negocio entre la API REST y el panel.

### 5.2 Catálogo de servicios (panel admin)

- Vista `servicios.ejs`: tabla con Marca, Categoría, Nombre, **Descripción**, Tipo, Precio(s), IVA y Acciones.
- La columna Precio(s) determina qué mostrar consultando directamente los campos de precio (`precio_unico !== null` → precio único; si no, `precio_plan_anual !== null` → plan anual/trimestral; si ninguno, "Manual") — **no** usa `es_editable` para esa decisión (ver sección 7).
- Las 55 descripciones del catálogo fueron verificadas exhaustivamente