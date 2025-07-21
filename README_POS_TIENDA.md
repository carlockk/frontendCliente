Este proyecto es una solución integral para ventas físicas y online. Incluye un sistema de Punto de Venta (POS) con administración, y una tienda web moderna con pagos en línea vía Stripe.

### Url principales:
https://frontpos.vercel.app/    (Dashboard admin del Punto de venta)
https://frontend-cliente-sigma.vercel.app/   (Sitio web cliente para compras en línea)

**Documentación Swagger:**
- [https://backendpos-yyy5.onrender.com/api-docs](https://backendpos-yyy5.onrender.com/api-docs)

**Render Backend:**
- [https://backendpos-yyy5.onrender.com](https://backendpos-yyy5.onrender.com)
--------

## Resumen de tecnologias

| Módulo            | Tecnologías Principales                                                           |
| ----------------- | --------------------------------------------------------------------------------- |
| Frontend Cliente  | React, Vite, Tailwind CSS, Axios, JWT, Context API, React Router DOM, Stripe      |
| Frontend Admin    | React, Vite, Material UI (MUI), Axios, Day.js, Flatpickr, Recharts, Context API   |
| Backend API*      | Node.js, Express.js, MongoDB (Mongoose), JWT, Multer, Cloudinary, Stripe, Swagger |
| Autenticación     | JWT para clientes y administradores, con middleware personalizado                 |
| Pagos             | Stripe Checkout (modo prueba), URLs de éxito/cancelación integradas               |
| Imágenes          | Cloudinary (almacenamiento externo)                                               |
| Documentación API | Swagger UI (`/api-docs`)                                                          |
| Correo            | Nodemailer (pendiente de integración para notificaciones de compra)               |


JWT y Autenticación

- Clave JWT: `JWT_SECRET=posailCliente`
- Middleware de protección en `middlewares/auth.js`
- Se protege tanto el login de clientes como el backend POS.

Stripe

- `STRIPE_SECRET_KEY` (modo prueba):  
  `sk_test
- URLs configuradas:  
  - Éxito: `https://frontend-cliente-sigma.vercel.app/success`  
  - Cancelación: `https://frontend-cliente-sigma.vercel.app/cancel`

---

# Proyecto POS + Tienda Online con Stripe entre otras opciones de pago

Este sistema está compuesto por tres grandes módulos: un **backend en Node.js**, un **frontend administrativo (POS)** y un **frontend cliente web** para compras online con integración de **Stripe**.

## SISTEMA POS (Backend + Frontend Admin)

### Backend POS

**Tecnologías principales:**
- Node.js + Express
- MongoDB (Mongoose)
- JWT para autenticación
- Stripe para pagos en línea
- Cloudinary (subida de imágenes)
- Nodemailer (envío de correos) //PENDIENTE, POR INTEGRAR
- Swagger (documentación interactiva)


**Rutas destacadas (Thunder Client):**
- Autenticación (Admin y Cliente)
- CRUD: Usuarios, Clientes, Productos, Categorías
- Tickets, Ventas POS y Ventas Cliente
- Pagos (Stripe)
- Caja: abrir, cerrar, historial

**Dependencias clave:**
```json
"express", "mongoose", "jsonwebtoken", "stripe", "cloudinary",
"nodemailer", "swagger-jsdoc", "swagger-ui-express", "multer",
"bcryptjs", "dotenv", "cors"
```

---

### Frontend POS (Panel Administrativo)

**Tecnologías:**
- React + Vite
- Material UI (MUI)
- Recharts (gráficas)
- Flatpickr / Day.js (fechas)
- Context API (Auth, Caja, Carrito)

**Características:**
- CRUD desde navegador
- Dashboard de gestión
- Modo oscuro (ThemeContext)
- Calendarios, filtros, búsqueda
- Interacción directa con el backend

**URL en Vercel:** [https://frontpos.vercel.app/](https://frontpos.vercel.app/)

**Dependencias:**
```json
"@mui/material", "axios", "recharts", "react-multi-date-picker",
"flatpickr", "@hello-pangea/dnd", "react-router-dom", "dayjs"
```

---

## FRONTEND CLIENTE WEB (Tienda Online)

**Tecnologías:**
- React + Vite + Tailwind CSS
- Context API + Reducer (auth y carrito)
- JWT persistente con localStorage
- React Router DOM + rutas privadas
- Stripe para pagos seguros

**Características:**
- Registro/Login
- Catálogo de productos
- Carrito y compra en línea
- Checkout con Stripe
- Historial de compras
- Perfil de usuario editable
- Drag and drop de categorías si el usuario está logueado

**URL en Vercel:** [https://frontend-cliente-sigma.vercel.app/](https://frontend-cliente-sigma.vercel.app/)

**Dependencias:**
```json
"axios", "react-router-dom", "@hello-pangea/dnd",
"@fortawesome/fontawesome-free", "react", "tailwindcss"
```

---

## UptimeRobot (mejora de carga inicial)
- Evita el retardo de 15-30 segundos en Render manteniendo la API encendida.
- Dashboard: [Uptime Robot](https://dashboard.uptimerobot.com/monitors/800989062)
- Endpoint monitoreado: `https://backendpos-yyy5.onrender.com/api/productos`

---

## STRUCTURA DE PROYECTOS BREVE RESUMEN

### Backend POS
```
backend/
├── server.js, .env, swagger.js
├── models/: productos, usuarios, ventas, tickets, etc.
├── routes/: productos, usuarios, pagos, caja, etc.
├── middlewares/, utils/, uploads/
```

### Frontend POS (Admin)
```
frontend/
├── App.jsx, Vite, .env
├── components/: Sidebar, ModalPago, VistaTicket, etc.
├── context/: AuthContext, CajaContext, CarritoContext
├── pages/: Dashboard, Caja, Productos, Tickets, etc.
```

### Frontend Cliente Web
```
src/
├── App.jsx, main.jsx, vite.config.js, tailwind.config.js
├── api/: index.js
├── components/: Navbar, SidebarFiltros, ProductList, etc.
├── contexts/: AuthContext, CartContext
├── pages/: Login, Register, Profile, Checkout, Compras, etc.
```
---


## RESUMEN GENERAL
-----------
### Tienda Online - Cliente Web
- URL: [frontend-cliente-sigma.vercel.app](https://frontend-cliente-sigma.vercel.app/)
- Cliente puede registrarse, comprar, ver historial, pagar con Stripe.
- Carrito, filtros, rutas protegidas, JWT persistente.

Propósito:
Una tienda online para que los clientes puedan navegar productos, agregarlos al carrito y pagar vía Stripe.

Funcionalidades principales:
Catálogo de productos con filtros por categoría y precio.
Carrito de compras con vista rápida de productos.
Registro/Login de clientes.
Perfil de usuario, con edición de datos.
Historial de compras.
Checkout con Stripe para pagos en línea.
Protección de rutas privadas usando JWT.
Diseño responsivo adaptado a dispositivos móviles.


-------------
### SISTEMA POS BACKEND
-------------
Propósito:
Una API y dashboard administrativo para gestionar toda la operación de ventas fisicas, productos y usuarios.

Funcionalidades principales:
Backend (API):
CRUD de:
Productos
Usuarios (admins y POS)
Categorías
Tickets
Registro de ventas POS y ventas de cliente online.
Gestión de caja (apertura y cierre).
Autenticación con JWT para POS y clientes.
Integración con Stripe para pagos seguros.
Subida de imágenes de productos a Cloudinary.
Documentación interactiva vía Swagger.

--------------------
### Sistema POS - Admin (FRONTEND)
- URL: [frontpos.vercel.app](https://frontpos.vercel.app/)
- Admin puede gestionar productos, ventas, usuarios, categorías, tickets y más.
- API documentada vía Swagger.
-------------------
Se encuentra bajo frontend/ y permite:
Login administrativo
Gestión desde el navegador
Interacción con la API
--


## Archivos donde se usa useState en frontend POS
-----------
App.jsx
components/CarritoDrawer.jsx
components/ModalCrearProducto.jsx
components/ModalEditarProducto.jsx
components/ModalPago.jsx
components/Sidebar.jsx
Todas las páginas como Dashboard.jsx, Caja.jsx, POS.jsx, Login.jsx y el resto..
Contextos como:
AuthContext.jsx
CajaContext.jsx
CarritoContext.jsx
ThemeContext.jsx

## User reducer se usa de forma global en 
-----------
contexts/cart/CartContext.jsx.

## Archivos donde se usa useEffect en Frontend cliente web
components/ProductList - copia.jsx
components/ProductList.jsx
components/ProductQuickView.jsx
components/SidebarFiltros.jsx
components/SlideCart.jsx
contexts/AuthContext.jsx
contexts/cart/CartContext.jsx
pages/Compras.jsx
pages/DetalleCompra.jsx
pages/Profile.jsx
pages/Success.jsx

** Estos archivos usan useEffect para realizar tareas como:**

Cargar productos desde el backend
Leer datos del carrito desde localStorage
Autenticar sesión del usuario
Obtener información del pedido
Reaccionar a cambios en el estado o props


## Thunder client
----------
Autenticación Admin
Login usuario (admin)	POST	https://backendpos-yyy5.onrender.com/api/auth/login	JSON: { email, password }

Usuarios (Admin)
Crear usuario	POST	https://backendpos-yyy5.onrender.com/api/usuarios	JSON: { nombre, email, password, rol }
Ver todos los usuarios	GET	https://backendpos-yyy5.onrender.com/api/usuarios	—
Editar usuario	PUT	https://backendpos-yyy5.onrender.com/api/usuarios/:id	JSON con campos a actualizar
Eliminar usuario	DELETE	https://backendpos-yyy5.onrender.com/api/usuarios/:id	—

Clientes
Registrar cliente	POST	https://backendpos-yyy5.onrender.com/api/clientes/register	JSON: { nombre, email, password, direccion, telefono }
Login cliente	POST	https://backendpos-yyy5.onrender.com/api/clientes/login	JSON: { email, password }
Ver todos los clientes	GET	https://backendpos-yyy5.onrender.com/api/clientes/todos	—
Ver perfil cliente	GET	https://backendpos-yyy5.onrender.com/api/clientes/perfil	Header: Authorization: Bearer <token>
Actualizar perfil cliente	PUT	https://backendpos-yyy5.onrender.com/api/clientes/perfil	Header + JSON: { nombre, direccion, telefono }

Productos
Ver productos	GET	https://backendpos-yyy5.onrender.com/api/productos	—
Ver producto por ID	GET	https://backendpos-yyy5.onrender.com/api/productos/:id	—
Crear producto	POST	https://backendpos-yyy5.onrender.com/api/productos	JSON: { nombre, precio, ... }
Actualizar producto	PUT	https://backendpos-yyy5.onrender.com/api/productos/:id	JSON con campos
Eliminar producto	DELETE	https://backendpos-yyy5.onrender.com/api/productos/:id	—

Categorías
Ver todas las categorías	GET	https://backendpos-yyy5.onrender.com/api/categorias	—
Ver categoría por ID	GET	https://backendpos-yyy5.onrender.com/api/categorias/:id	—
Crear categoría	POST	https://backendpos-yyy5.onrender.com/api/categorias	JSON: { nombre, descripcion }
Editar categoría	PUT	https://backendpos-yyy5.onrender.com/api/categorias/:id	JSON con campos
Eliminar categoría	DELETE	https://backendpos-yyy5.onrender.com/api/categorias/:id	—

Caja
Abrir caja	POST	https://backendpos-yyy5.onrender.com/api/caja/abrir	JSON: { monto_inicial }
Cerrar caja	POST	https://backendpos-yyy5.onrender.com/api/caja/cerrar	JSON: { nombre }
Historial de cajas	GET	https://backendpos-yyy5.onrender.com/api/caja/historial	—

Tickets
Guardar ticket	POST	https://backendpos-yyy5.onrender.com/api/tickets	JSON: { nombre, productos, total }
Ver tickets	GET	https://backendpos-yyy5.onrender.com/api/tickets	—
Eliminar ticket	DELETE	https://backendpos-yyy5.onrender.com/api/tickets/:id	—

Ventas (POS)
Crear venta	POST	https://backendpos-yyy5.onrender.com/api/ventas	JSON: { productos, total, ... }
Obtener ventas	GET	https://backendpos-yyy5.onrender.com/api/ventas	—

Ventas Cliente
Crear venta cliente	POST	https://backendpos-yyy5.onrender.com/api/ventasCliente	JSON con detalles
Obtener ventas de cliente	GET	https://backendpos-yyy5.onrender.com/api/ventasCliente/:clienteId	—

Pagos (Stripe)
Crear sesión de pago	POST	https://backendpos-yyy5.onrender.com/api/pagos/crear-sesion	JSON: { items: [{ nombre, precio, cantidad }] }
----------

Todo esta adaptado para vistas en dispositivos móviles aunque estoy en costante mejora reparando diseño y haciendo que se vea mejor.


### Próximas mejoras:
- Integrar stripe en modo producción para el cobro real
- Hacer funcionar la dependencia de correo para envío de notificaciones de compra de cliente en línea
- Desarrollar un sistema ya sea dentro de la misma web cliente o fuera de ella que sea capaz de notificar cuando llega un pedido, que genere una alerta con sonido de nuevo pedido, que permita mostrar los datos del pedido y que emita una impresión de comanda para la cocina con el detalle y numero de orden del pedido.
- Permitir el CRUD completo de las categorías, por el momento solo se pueden crear
- Permitir las transferencias electronicas
- Habilitar pago por sdk o algun tipo para pos fisicos al estilo wiboo para autoatención desde el mismo Web cliente
- Crear una Progressive Web App con service worker para offline
- Buscar la forma de poner o conectar con la API de instagram para crear una pestaña y mostrar las publicaciones en el web
- crear un home en el web cliente y mostrar contenido relevante

