
# OmniLogistics
### Sistema Web de Gestión de Inventario, Ciberseguridad y Análisis de Datos

**Proyecto de Titulación — Técnico en Informática | IPLACEX**

**Autor:** Leandro Emanuel Dall Orso Montes  
**Año:** 2026  
**Versión:** 1.0.0

## 1. Descripción

OmniLogistics es una aplicación web para la administración y control de inventarios de hardware, desarrollada mediante una arquitectura cliente-servidor y una base de datos NoSQL.

El sistema permite gestionar productos, registrar movimientos de inventario, controlar el acceso mediante perfiles de usuario y consultar indicadores operacionales y eventos de seguridad.

Integra un módulo de visualización de datos mediante Chart.js y un módulo de auditoría de seguridad.

## 2. Tecnologías utilizadas

### Backend
- Node.js
- Express 5
- JavaScript
- API REST

### Base de datos
- MongoDB
- Mongoose 9

### Seguridad
- JSON Web Token (JWT)
- bcryptjs
- Helmet
- CORS
- express-validator
- Control de acceso basado en roles (RBAC)

### Frontend
- HTML5
- CSS3
- JavaScript
- Chart.js 4

## 3. Arquitectura del sistema

OmniLogistics utiliza una arquitectura de tres componentes:

1. **Frontend:** interfaz web desarrollada con HTML, CSS y JavaScript.
2. **Backend:** servidor Node.js con Express, controladores, rutas y middlewares.
3. **Base de datos:** MongoDB para almacenar usuarios, productos, movimientos y registros de seguridad.

Flujo general:

```text
Usuario
   |
   v
Frontend (HTML / CSS / JavaScript)
   |
   | Solicitudes HTTP
   v
API REST (Node.js + Express)
   |
   | Autenticación JWT y RBAC
   v
Controladores y modelos Mongoose
   |
   v
MongoDB
```

## 4. Funcionalidades

### Gestión de usuarios
- Inicio de sesión mediante credenciales.
- Autenticación mediante JWT.
- Perfiles Administrador y Operador.
- Restricciones de acceso según permisos.

### Gestión de inventario
- Registro de productos.
- Consulta de productos.
- Actualización de información.
- Validación de códigos SKU únicos.
- Paginación de resultados.

### Movimientos de inventario
- Registro de entradas.
- Registro de salidas.
- Actualización de existencias.
- Validación de stock disponible.
- Consulta del historial de movimientos.

### Ciberseguridad
- Registro de eventos de autenticación.
- Consulta de registros de seguridad.
- Clasificación de eventos según nivel de alerta.
- Visualización de indicadores de seguridad.

### Big Data y análisis
- Consulta de información del inventario.
- Indicadores de productos y categorías.
- Visualización de datos mediante Chart.js.
- Consultas paginadas sobre más de 5.000 productos.

## 5. Estructura del proyecto

```text
OmniLogistics/
|
|-- config/
|-- controllers/
|-- middlewares/
|-- models/
|-- public/
|-- routes/
|-- scripts/
|
|-- .gitignore
|-- package.json
|-- package-lock.json
|-- server.js
|-- README.md
```

## 6. Requisitos previos

Para ejecutar el proyecto localmente se necesita:

- Node.js compatible con las dependencias instaladas.
- npm.
- MongoDB.
- Un navegador web moderno.

## 7. Instalación

Clonar el repositorio:

```bash
git clone https://github.com/dallorsomontes-png/OmniLogisticsProyectoTitulacion.git
```

Ingresar a la carpeta:

```bash
cd OmniLogisticsProyectoTitulacion
```

Instalar las dependencias:

```bash
npm install
```

Crear un archivo `.env` en la raíz del proyecto y configurar las variables de entorno requeridas por la aplicación.

**Importante:** el archivo `.env` no se incluye en el repositorio por motivos de seguridad. No se deben publicar contraseñas ni claves JWT reales.

Con MongoDB disponible y la configuración completada, iniciar el servidor:

```bash
node server.js
```

En la configuración local utilizada durante el desarrollo, la aplicación se ejecuta en el puerto 5000.

## 8. API REST

El sistema implementa endpoints para:

- Autenticación de usuarios: `/api/auth`
- Gestión de productos: `/api/productos`
- Registro y consulta de movimientos.
- Consulta de eventos de seguridad.
- Comprobación del estado del servicio: `/api/health`

Los endpoints protegidos requieren autenticación mediante JWT.

## 9. Plan de pruebas

Durante la validación funcional se ejecutaron 14 casos de prueba.

| Caso | Descripción | Resultado |
|---|---|---|
| CP01 | Autenticación correcta | Aprobado |
| CP02 | Credenciales incorrectas | Aprobado |
| CP03 | Acceso sin JWT | Aprobado |
| CP04 | Restricción de permisos RBAC | Aprobado |
| CP05 | Registro de producto | Aprobado |
| CP06 | Validación de SKU duplicado | Aprobado |
| CP07 | Actualización de producto | Aprobado |
| CP08 | Paginación de inventario | Aprobado |
| CP09 | Entrada de stock | Aprobado |
| CP10 | Salida de stock | Aprobado |
| CP11 | Rechazo por stock insuficiente | Aprobado |
| CP12 | Historial de movimientos | Aprobado |
| CP13 | Consulta de registros de seguridad | Aprobado |
| CP14 | Rendimiento de API con más de 5.000 productos | Aprobado |

## 10. Resultados de rendimiento

La evaluación local CP14 utilizó una base de datos con 5.001 productos distribuidos en 10 categorías.

Se realizaron 30 solicitudes HTTP GET secuenciales y autenticadas, utilizando paginación de 100 productos por consulta.

| Indicador | Resultado |
|---|---|
| Productos registrados | 5.001 |
| Categorías | 10 |
| Solicitudes ejecutadas | 30 |
| Solicitudes exitosas | 30 |
| Tiempo promedio | 15,78 ms |
| Tiempo mínimo | 10 ms |
| Tiempo máximo | 18,9 ms |
| Consultas inferiores a 2 segundos | 100 % |

Estas mediciones corresponden a un entorno local y no representan pruebas de concurrencia ni de rendimiento en producción.

## 11. Consideraciones de seguridad

El proyecto incorpora mecanismos de autenticación, autorización, validación de datos y registro de eventos.

Las credenciales y claves privadas deben mantenerse fuera del repositorio público mediante variables de entorno.

La publicación del código fuente no implica que la aplicación esté desplegada en un servidor público.

## 12. Contexto académico

Este software fue desarrollado como parte del Proyecto de Titulación de la carrera Técnico en Informática de IPLACEX, durante el año 2026.

El proyecto integra conocimientos de desarrollo web, bases de datos NoSQL, programación backend, seguridad informática, arquitectura de software y análisis de datos.

## 13. Autor

**Leandro Emanuel Dall Orso Montes**  
Técnico en Informática — IPLACEX

GitHub: https://github.com/dallorsomontes-png

---

**OmniLogistics — Proyecto de Titulación 2026**
