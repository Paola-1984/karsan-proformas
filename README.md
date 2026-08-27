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
- Las 55 descripciones del catálogo fueron verificadas exhaustivamente contra el Excel oficial "Nuevos Precios" del cliente — coinciden exactamente.

### 5.3 Vista pública de la proforma (plantilla HTML)

- Renderizada íntegramente en el servidor en cada visita (`proformaVistaController.js` → `construirHtmlProforma()`), no es un archivo estático ni un PDF adjunto.
- **Identidad visual por marca:** variables CSS (`--color-primario`, `--color-secundario`) tomadas de la tabla `marcas`; tipografía Montserrat (Google Fonts) según manual de marca; acento `#F4DC00` de uso puntual (franja del total, badge de estado).
- **Layout en tarjetas** (`.card`) con sombra suave, animación de entrada `fade-in-up` (respeta `prefers-reduced-motion`), hover en filas de tabla y botones.
- **Contacto y redes sociales dinámicos:** `renderContacto()` y `renderRedesSociales()` muestran solo los campos que existen en BD para esa marca, con iconografía SVG oficial embebida (WhatsApp verde `#25D366`, Facebook azul `#1877F2`, Instagram con degradado oficial, TikTok negro — no dependen de servicios externos).
- **Impresión A4:** `@media print` fuerza el respeto de colores de fondo, oculta el portafolio (`.no-imprimir`) y los botones de acción, y ajusta márgenes/paddings para que el contenido entre en una sola hoja.

### 5.4 Reglas de negocio no evidentes (documentadas para evitar falsos "bugs")

- `direccion = NULL` en Karsan Escuela Digital es **intencional** (modelo de capacitación itinerante, sin local fijo), no un dato faltante.
- Todos los campos de contacto/identidad de Dr. BACH permanecen en `NULL` o placeholder (`pendiente@bachagencia.com`) hasta que concluya el trámite de registro de marca ante el SENADI.
- El logo actual de Karsan Escuela Digital (`sinslogan-blanco.png`) se mantiene definitivamente — se evaluó reemplazarlo por una versión de mayor resolución y se decidió no hacerlo.

---

## 6. Instrucciones para levantar el proyecto localmente

```bash
# 1. Clonar el repositorio
git clone https://github.com/Paola-1984/karsan-proformas.git
cd karsan-proformas
git checkout dev

# 2. Instalar dependencias
npm install

# 3. Crear la base de datos MySQL y las tablas
#    (importar el schema.sql correspondiente o crear las tablas descritas en la sección 3)

# 4. Crear el archivo .env en la raíz (ver sección 4.1)

# 5. Levantar el servidor en modo desarrollo (con recarga automática)
npm run dev

# El servidor queda disponible en:
# http://localhost:3000

# Panel de administración:
# http://localhost:3000/admin/login

# Vista pública de una proforma:
# http://localhost:3000/proforma/{numero_correlativo}
```

### Resolución de problemas comunes (Windows)

```bash
# Puerto 3000 ocupado
netstat -ano | findstr :3000
taskkill /PID <numero_de_pid> /F

# Problemas de codificación en la terminal de MySQL
chcp 65001
mysql -u root -p --default-character-set=utf8mb4
```

> **Nota sobre nodemon:** en algunos casos, tras varias ediciones seguidas del mismo archivo, nodemon no reinicia automáticamente. Si no aparece `[nodemon] restarting due to changes...` en la terminal tras guardar, detener el proceso (`Ctrl+C`) y volver a correr `npm run dev` manualmente.

---

## 7. Estado actual del desarrollo

### Completado

- [x] Backend Express + MySQL con estructura de rutas/controladores/middlewares
- [x] Autenticación JWT (cookie httpOnly para panel, JSON para API)
- [x] Panel de administración completo en EJS: login, proformas, clientes, servicios (solo ADMIN), portafolio (solo ADMIN)
- [x] Lógica de cálculo de precios con los cuatro modos (`determinarModoPrecio`)
- [x] Envío de proformas por email (Nodemailer)
- [x] Catálogo de 55 servicios auditado fila por fila contra la lista de precios oficial del cliente (precios y descripciones)
- [x] Limpieza de registros de prueba en `servicios_catalogo`
- [x] Entorno de desarrollo con `nodemon`
- [x] Rediseño visual completo de la proforma pública (tipografía de marca, tarjetas, interactividad, impresión A4 optimizada)
- [x] Logos SVG oficiales en el footer (WhatsApp, Facebook, Instagram, TikTok)
- [x] Redes sociales oficiales de Karsan Escuela Digital cargadas y confirmadas
- [x] **Bug corregido:** columna "Precio(s)" del catálogo admin mostraba `$0.00` en servicios de Dr. BACH con `precio_unico`, por usar `es_editable` como criterio en vez de verificar directamente los campos de precio
- [x] Columna "Descripción" agregada a la tabla del catálogo admin
- [x] Incidente de seguridad resuelto: `.env` removido del control de versiones, credenciales rotadas

### Pendiente

- [ ] Todos los datos oficiales de Dr. BACH (nombre comercial, correo, teléfono, redes, hosting) — bloqueados hasta la resolución del trámite ante el SENADI
- [ ] Definir `APP_BASE_URL` real de producción para que los enlaces de email funcionen fuera de `localhost`
- [ ] Despliegue a producción

---

## 8. Convenciones del proyecto

- **Commits:** siempre precedidos de `git status` → verificar ausencia de `.env` → `git --no-pager diff` para revisar cambios.
- **Nombres reales de tablas/columnas** (para evitar errores de sintaxis SQL por nombres asumidos):
  - La tabla de servicios se llama `servicios_catalogo`, no `servicios`.
  - `es_editable`, no `editable`.
  - `correo_remitente`, no `correo`.
  - `tiktok_url`, `facebook_url`, `instagram_url`, `linkedin_url` (con sufijo `_url`), no a secas.
- **`es_editable` ≠ esquema de precio:** no usar este campo para decidir si un servicio tiene precio único o plan anual/trimestral — consultar directamente `precio_unico`/`precio_plan_anual`.
- **Contraste de marca:** `color_secundario` puede ser `#000000` — verificar siempre el contraste de cualquier texto/elemento nuevo contra ese fondo.