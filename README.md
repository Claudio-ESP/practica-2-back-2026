# Biblioteca API

API REST para gestionar libros y préstamos de una biblioteca, hecha con Node.js, Express y TypeScript.

## Arrancar el servidor

npm install

npm run dev

El servidor se abre en http://localhost:3000

## Endpoints

GET /libros
GET /libros/:id
POST /libros
PUT /libros/:id
PATCH /libros/:id
DELETE /libros/:id
GET /prestamos
GET /libros/:id/prestamos
POST /libros/:id/prestar
POST /libros/:id/devolver
GET /estadisticas
