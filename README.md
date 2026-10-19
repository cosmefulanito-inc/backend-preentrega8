# Sistema Backend de Turnos y Reservas

API REST construida con Node.js y Express para gestionar servicios y reservas. Los datos se almacenan en una base de datos MongoDB (MongoDB Atlas), a través de Mongoose.

La API permite filtrar, paginar y ordenar el listado de servicios, valida los datos de entrada con Zod antes de que lleguen a la base de datos, y devuelve las reservas con los datos completos de sus servicios mediante `populate`.

Además, el proyecto incluye vistas renderizadas en el servidor con Handlebars y actualización en tiempo real con Socket.io.

## Tecnologías

- Node.js
- Express
- MongoDB Atlas
- Mongoose
- Zod
- Handlebars (express-handlebars)
- Socket.io
- dotenv

## Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/cosmefulanito-inc/backend-preentrega8.git
```

2. Entrar a la carpeta del proyecto:

```bash
cd backend-preentrega8
```

3. Instalar las dependencias:

```bash
npm install
```

4. Crear un archivo `.env` en la raíz del proyecto, tomando como modelo `.env.example`:

```
PORT=8080
NODE_ENV=development
MONGODB_URI=mongodb+srv://<usuario>:<contraseña>@<cluster>.mongodb.net/<base-de-datos>
```

> Para conectarse a MongoDB Atlas, la IP desde la que se ejecuta el proyecto tiene que estar habilitada en **Network Access** dentro del panel de Atlas. Si la conexión falla, el servidor no llega a iniciarse.

## Ejecución

```bash
npm start
```

El servidor queda disponible en `http://localhost:8080`. La API responde en las rutas `/api/...` y las vistas en las rutas `/views/...`.

## Arquitectura por capas

El proyecto está organizado en capas. Cada una tiene una única responsabilidad y solo se comunica con la capa inmediatamente inferior:

```
Petición HTTP
     ↓
  Router        → define el endpoint
     ↓
  Middleware    → valida los datos de entrada (solo en los endpoints que reciben datos)
     ↓
  Controller    → lee la request y arma la response (JSON o vista)
     ↓
  Service       → aplica las reglas del negocio
     ↓
  Repository    → intermediario entre el negocio y el acceso a datos
     ↓
  DAO           → lee y escribe en MongoDB mediante los modelos de Mongoose
     ↓
  MongoDB Atlas
```

- **routes/**: definen los endpoints y los conectan con su controller. No contienen lógica: cuando un endpoint necesita validación, solo se coloca el middleware correspondiente antes del controller.
- **middlewares/**: funciones por las que pasa la petición antes de llegar al controller. El middleware de validación revisa los datos con un esquema de Zod y corta el flujo si son inválidos.
- **validations/**: esquemas de Zod que describen cómo tienen que ser los datos válidos de servicios y reservas.
- **controllers/**: leen `req.params`, `req.query` y `req.body`, llaman al service correspondiente y arman la respuesta. Los controllers de la API responden con `res.status().json()`; el controller de vistas responde con `res.render()`. Son la única capa que conoce Express.
- **services/**: contienen las reglas del negocio. Por ejemplo, que toda reserva nueva se crea con estado `pending` y sin servicios, que agregar a una reserva un servicio que ya tiene incrementa su cantidad, o los valores por defecto de la paginación y los campos por los que se permite ordenar.
- **repositories/**: exponen al service las operaciones de datos y las delegan en el DAO.
- **dao/**: acceden directamente a la base de datos. Guardan y consultan los datos tal como los reciben, sin tomar decisiones. Las consultas usan `.lean()` para devolver objetos planos de JavaScript.
- **models/**: definen los esquemas de Mongoose (campos, tipos y validaciones) de servicios y reservas.
- **views/**: plantillas de Handlebars. Reciben los datos desde el controller de vistas y no contienen información escrita a mano.
- **public/**: archivos estáticos que Express envía al navegador sin procesar (hojas de estilo y el script del cliente de Socket.io).

## Consultas avanzadas de servicios

`GET /api/services` acepta los siguientes query params, que pueden combinarse entre sí:

| Parámetro | Descripción | Valor por defecto |
|---|---|---|
| `category` | Filtra por categoría | Sin filtro |
| `available` | Filtra por disponibilidad: `true` o `false` | Sin filtro |
| `page` | Número de página | `1` |
| `limit` | Cantidad de servicios por página | `10` |
| `sortBy` | Campo por el que se ordena: `name`, `price`, `duration` o `category` | Sin orden |
| `order` | Sentido del orden: `asc` (ascendente) o `desc` (descendente) | `asc` |

Si `page` o `limit` no son números positivos, se usan los valores por defecto. Si `sortBy` no es uno de los campos permitidos, el listado no se ordena.

La paginación se resuelve con `skip` y `limit` de Mongoose: para la página `n`, se saltean `(n - 1) × limit` documentos. El total se obtiene con `countDocuments`, aplicando el mismo filtro que el listado, de modo que los metadatos corresponden siempre a los resultados filtrados.

### Ejemplos

| Consulta | Resultado |
|---|---|
| `GET /api/services` | Los primeros 10 servicios |
| `GET /api/services?category=salud` | Solo los servicios de la categoría salud |
| `GET /api/services?available=true` | Solo los servicios disponibles |
| `GET /api/services?limit=5&page=2` | Los servicios del 6 al 10 |
| `GET /api/services?sortBy=price&order=desc` | Ordenados del más caro al más barato |
| `GET /api/services?category=salud&available=true&sortBy=name&limit=5` | Servicios de salud disponibles, ordenados por nombre, de a 5 |

### Formato de la respuesta

La respuesta incluye el listado de la página pedida y los metadatos de paginación:

```json
{
  "payload": [
    {
      "_id": "66ab12f4c9e8a1b2c3d4e5f6",
      "name": "Consulta general",
      "description": "Atención clínica general",
      "duration": 30,
      "price": 5000,
      "category": "salud",
      "available": true
    }
  ],
  "total": 12,
  "page": 2,
  "limit": 5,
  "totalPages": 3,
  "hasPrevPage": true,
  "hasNextPage": true
}
```

| Campo | Significado |
|---|---|
| `payload` | Servicios de la página actual |
| `total` | Total de servicios que cumplen el filtro |
| `page` | Página actual |
| `limit` | Cantidad de servicios por página |
| `totalPages` | Total de páginas |
| `hasPrevPage` | Indica si existe una página anterior |
| `hasNextPage` | Indica si existe una página siguiente |

## Validación de datos con Zod

Los endpoints que reciben datos los validan con esquemas de Zod antes de llegar al controller. Si los datos son inválidos, la API responde `400` con un mensaje claro y la petición no llega a MongoDB. Si son válidos, el middleware reemplaza `req.body` por los datos ya validados: con los espacios sobrantes recortados y sin los campos que no figuran en el esquema.

La validación se aplica mediante un único middleware reutilizable, `validateBody(schema)`, que recibe el esquema correspondiente a cada endpoint. Los esquemas están en `validations/` y el middleware en `middlewares/`; ni las rutas ni los modelos contienen lógica de validación.

Las validaciones de Zod no reemplazan a las de los modelos de Mongoose: funcionan como un primer filtro, y los modelos siguen validando al guardar.

### Validaciones aplicadas

| Endpoint | Esquema | Reglas |
|---|---|---|
| `POST /api/services` | `createServiceSchema` | `name` y `category` obligatorios y no vacíos; `description` opcional; `duration` entero mayor o igual a 1; `price` número mayor o igual a 0; `available` booleano |
| `PUT /api/services/:sid` | `updateServiceSchema` | Las mismas reglas que al crear, pero todos los campos son opcionales |
| `POST /api/bookings` | `createBookingSchema` | `clientName` obligatorio y no vacío; `clientEmail` con formato de email; `date` con formato `AAAA-MM-DD`; `time` con formato `HH:MM` |
| `POST /api/bookings/:bid/services/:sid` | `addServiceToBookingSchema` | `quantity` opcional; si se envía, entero mayor o igual a 1 (por defecto, 1) |

Los números tienen que enviarse como números en el JSON: `"price": 5000` es válido, pero `"price": "5000"` no.

Al crear una reserva no se acepta el campo `status`: como no figura en el esquema, se descarta, y la reserva se crea siempre con estado `pending`.

### Ejemplo de respuesta con datos inválidos

Petición `POST /api/services` con este body:

```json
{
  "name": "",
  "duration": 30,
  "price": -100,
  "category": "salud",
  "available": true
}
```

Respuesta `400`:

```json
{
  "status": "error",
  "message": "Datos inválidos",
  "error": [
    { "field": "name", "message": "El nombre es obligatorio" },
    { "field": "price", "message": "El precio no puede ser negativo" }
  ]
}
```

## Reservas y populate

Cada reserva guarda los servicios que incluye como referencias: el `_id` del servicio y la cantidad reservada.

```json
"services": [
  { "service": "66ab12f4c9e8a1b2c3d4e5f6", "quantity": 2 }
]
```

En la base de datos nunca se guarda el objeto completo del servicio. El modelo de reservas indica, con `ref: "Service"`, que ese `_id` corresponde a la colección de servicios.

### Consultar una reserva con sus servicios completos

`GET /api/bookings/:bid` usa `populate` para reemplazar, solo en la respuesta, cada referencia por los datos completos del servicio:

```json
{
  "_id": "66ac45a1b2c3d4e5f6a7b8c9",
  "clientName": "Ana Pérez",
  "clientEmail": "ana@mail.com",
  "date": "2026-10-15T00:00:00.000Z",
  "time": "10:30",
  "status": "pending",
  "services": [
    {
      "service": {
        "_id": "66ab12f4c9e8a1b2c3d4e5f6",
        "name": "Consulta general",
        "description": "Atención clínica general",
        "duration": 30,
        "price": 5000,
        "category": "salud",
        "available": true
      },
      "quantity": 2
    }
  ]
}
```

Para probarlo:

1. Crear una reserva con `POST /api/bookings`.
2. Agregarle un servicio con `POST /api/bookings/:bid/services/:sid`.
3. Consultarla con `GET /api/bookings/:bid`.

## Vistas con Handlebars

Express usa Handlebars como motor de vistas. Todas las vistas comparten el layout `views/layouts/main.handlebars`.

| Ruta | Vista | Contenido |
|---|---|---|
| `/views/services` | `services.handlebars` | Listado de servicios con nombre, descripción, duración, precio, categoría y disponibilidad |
| `/views/bookings` | `bookings.handlebars` | Listado de reservas |

El controller de vistas usa los mismos services que la API, de modo que la información que se muestra en el navegador pasa por todas las capas. La vista de servicios muestra el listado completo, sin paginar.

## Tiempo real con Socket.io

Socket.io se configura en `server.js`, sobre el mismo servidor HTTP que Express. La instancia se guarda con `app.set("io", io)` para que los controllers puedan acceder a ella.

| Evento | Se emite cuando | Efecto en el navegador |
|---|---|---|
| `service:created` | Se crea un servicio con `POST /api/services` | La vista `/views/services` agrega el nuevo servicio a la tabla sin recargar la página |

## Estructura del proyecto

```
src/
  config/
    env.config.js
    database.config.js
  routes/
    services.router.js
    bookings.router.js
    views.router.js
  middlewares/
    validate.middleware.js
  validations/
    service.validation.js
    booking.validation.js
  controllers/
    services.controller.js
    bookings.controller.js
    views.controller.js
  services/
    services.service.js
    bookings.service.js
  repositories/
    services.repository.js
    bookings.repository.js
  dao/
    mongo/
      services.mongo.dao.js
      bookings.mongo.dao.js
    fileSystem/
      services.fs.dao.js
      bookings.fs.dao.js
  models/
    service.model.js
    bookings.model.js
  views/
    layouts/
      main.handlebars
    services.handlebars
    bookings.handlebars
  public/
    css/
      styles.css
    js/
      socket.js
  app.js
  server.js
```

## Endpoints

Los ids de las rutas (`:sid` y `:bid`) corresponden al `_id` que MongoDB asigna a cada documento. Si el id no tiene un formato válido o no existe, la API responde que el registro no fue encontrado.

### Services

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/services` | Lista los servicios con filtros, paginación y ordenamiento |
| GET | `/api/services/:sid` | Obtiene un servicio por su id |
| POST | `/api/services` | Crea un nuevo servicio. Valida los datos con Zod |
| PUT | `/api/services/:sid` | Actualiza un servicio existente. Valida los datos con Zod |
| DELETE | `/api/services/:sid` | Elimina un servicio |

Ejemplo de body para crear un servicio:

```json
{
  "name": "Consulta general",
  "description": "Atención clínica general",
  "duration": 30,
  "price": 5000,
  "category": "salud",
  "available": true
}
```

### Bookings

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/bookings` | Lista todas las reservas |
| POST | `/api/bookings` | Crea una nueva reserva. Valida los datos con Zod |
| GET | `/api/bookings/:bid` | Obtiene una reserva por su id, con los datos completos de sus servicios |
| POST | `/api/bookings/:bid/services/:sid` | Agrega un servicio a una reserva existente. Valida que el servicio exista y la cantidad con Zod |
| DELETE | `/api/bookings/:bid` | Elimina una reserva |

Ejemplo de body para crear una reserva:

```json
{
  "clientName": "Ana Pérez",
  "clientEmail": "ana@mail.com",
  "date": "2026-10-15",
  "time": "10:30"
}
```

Ejemplo de body para agregar un servicio a una reserva (opcional):

```json
{
  "quantity": 2
}
```

Toda reserva nueva se crea con estado `pending` y sin servicios. Si el mismo servicio se agrega más de una vez a una reserva, se incrementa su cantidad (`quantity`).

### Vistas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/views/services` | Renderiza el listado de servicios. Se actualiza en tiempo real al crear un servicio |
| GET | `/views/bookings` | Renderiza el listado de reservas |

## Evolución del proyecto

- **Almacenamiento en MongoDB:** los datos, que antes se guardaban en archivos JSON, pasaron a MongoDB. Gracias a la arquitectura por capas, el cambio se concentró en los DAOs (`dao/mongo/`); los DAOs de archivos se conservan en `dao/fileSystem/` como referencia.
- **Vistas y tiempo real:** se agregaron vistas con Handlebars y actualización en tiempo real con Socket.io, sin reemplazar la API.
- **Consultas avanzadas, validación y populate:** se incorporaron filtros, paginación y ordenamiento en el listado de servicios, validación de datos con Zod mediante middlewares, y la consulta de reservas con los servicios completos mediante `populate`.