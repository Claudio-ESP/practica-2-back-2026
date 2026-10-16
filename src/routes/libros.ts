import { Router, Request, Response } from "express";
import * as db from "../data";
import { Libro, Prestamo } from "../types";

const router = Router();

const error = (res: Response, status: number, mensaje: string) =>
  res.status(status).json({ error: mensaje });

const textoValido = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const añoValido = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);

// Devuelve el libro o responde con 400/404 y devuelve null
function buscarLibro(req: Request, res: Response): Libro | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    error(res, 400, "El id debe ser un número entero");
    return null;
  }
  const libro = db.libros.find((l) => l.id === id);
  if (!libro) {
    error(res, 404, "Libro no encontrado");
    return null;
  }
  return libro;
}

const esDuplicado = (titulo: string, autor: string, ignorarId?: number) =>
  db.libros.some(
    (l) =>
      l.id !== ignorarId &&
      l.titulo.trim().toLowerCase() === titulo.trim().toLowerCase() &&
      l.autor.trim().toLowerCase() === autor.trim().toLowerCase()
  );

// El body puede traer "año" (como en los ejemplos) o "anio"
const leerAño = (body: any) => body.año ?? body.anio;

// ---------- Libros ----------

// GET /libros?disponible=true|false&autor=texto
router.get("/", (req, res) => {
  const { disponible, autor } = req.query;
  let resultado = db.libros;
  if (disponible !== undefined) {
    if (disponible !== "true" && disponible !== "false") {
      return error(res, 400, "El parámetro disponible debe ser true o false");
    }
    resultado = resultado.filter((l) => l.disponible === (disponible === "true"));
  }
  if (typeof autor === "string") {
    resultado = resultado.filter((l) => l.autor.toLowerCase().includes(autor.toLowerCase()));
  }
  res.status(200).json(resultado);
});

router.get("/:id", (req, res) => {
  const libro = buscarLibro(req, res);
  if (libro) res.status(200).json(libro);
});

router.post("/", (req, res) => {
  const { titulo, autor } = req.body ?? {};
  const año = leerAño(req.body ?? {});
  if (!textoValido(titulo) || !textoValido(autor) || !añoValido(año)) {
    return error(res, 400, "Los campos titulo, autor y año son obligatorios y deben ser válidos");
  }
  if (esDuplicado(titulo, autor)) {
    return error(res, 409, "Ya existe un libro con el mismo título y autor");
  }
  const libro: Libro = { id: db.nuevoLibroId(), titulo, autor, año, disponible: true };
  db.libros.push(libro);
  res.status(201).json(libro);
});

router.put("/:id", (req, res) => {
  const libro = buscarLibro(req, res);
  if (!libro) return;
  const body = req.body ?? {};
  if (body.id !== undefined) return error(res, 400, "No se puede modificar el id");
  const { titulo, autor } = body;
  const año = leerAño(body);
  if (!textoValido(titulo) || !textoValido(autor) || !añoValido(año)) {
    return error(res, 400, "PUT requiere todos los campos: titulo, autor y año");
  }
  if (esDuplicado(titulo, autor, libro.id)) {
    return error(res, 409, "Ya existe un libro con el mismo título y autor");
  }
  Object.assign(libro, { titulo, autor, año });
  res.status(200).json(libro);
});

router.patch("/:id", (req, res) => {
  const libro = buscarLibro(req, res);
  if (!libro) return;
  const body = req.body ?? {};
  if (body.id !== undefined) return error(res, 400, "No se puede modificar el id");

  const cambios: Partial<Libro> = {};
  if (body.titulo !== undefined) {
    if (!textoValido(body.titulo)) return error(res, 400, "titulo inválido");
    cambios.titulo = body.titulo;
  }
  if (body.autor !== undefined) {
    if (!textoValido(body.autor)) return error(res, 400, "autor inválido");
    cambios.autor = body.autor;
  }
  if (leerAño(body) !== undefined) {
    if (!añoValido(leerAño(body))) return error(res, 400, "año inválido");
    cambios.año = leerAño(body);
  }
  if (body.disponible !== undefined) {
    if (typeof body.disponible !== "boolean") return error(res, 400, "disponible inválido");
    if (body.disponible !== libro.disponible) {
      return error(res, 409, "La disponibilidad se gestiona mediante /prestar y /devolver");
    }
  }
  if (Object.keys(cambios).length === 0 && body.disponible === undefined) {
    return error(res, 400, "No se ha enviado ningún campo para modificar");
  }
  if (esDuplicado(cambios.titulo ?? libro.titulo, cambios.autor ?? libro.autor, libro.id)) {
    return error(res, 409, "Ya existe un libro con el mismo título y autor");
  }
  Object.assign(libro, cambios);
  res.status(200).json(libro);
});

router.delete("/:id", (req, res) => {
  const libro = buscarLibro(req, res);
  if (!libro) return;
  if (!libro.disponible) {
    return error(res, 409, "No se puede borrar un libro que está prestado");
  }
  db.eliminarLibro(libro.id);
  res.status(204).send();
});

// ---------- Préstamos de un libro ----------

router.get("/:id/prestamos", (req, res) => {
  const libro = buscarLibro(req, res);
  if (!libro) return;
  res.status(200).json(db.prestamos.filter((p) => p.libroId === libro.id));
});

router.post("/:id/prestar", (req, res) => {
  const libro = buscarLibro(req, res);
  if (!libro) return;
  const { usuario } = req.body ?? {};
  if (!textoValido(usuario)) {
    return error(res, 400, "El campo usuario es obligatorio y debe ser un texto no vacío");
  }
  if (!libro.disponible) {
    return error(res, 409, "El libro ya está prestado");
  }
  const nombre = usuario.trim();
  const activos = db.prestamos.filter(
    (p) => p.fechaDevolucion === null && p.usuario.toLowerCase() === nombre.toLowerCase()
  ).length;
  if (activos >= 2) {
    return error(res, 409, "El usuario ya tiene 2 libros prestados");
  }
  const prestamo: Prestamo = {
    id: db.nuevoPrestamoId(),
    libroId: libro.id,
    usuario: nombre,
    fechaPrestamo: new Date().toISOString().slice(0, 10),
    fechaDevolucion: null
  };
  db.prestamos.push(prestamo);
  libro.disponible = false;
  res.status(201).json(prestamo);
});

router.post("/:id/devolver", (req, res) => {
  const libro = buscarLibro(req, res);
  if (!libro) return;
  const prestamo = db.prestamos.find((p) => p.libroId === libro.id && p.fechaDevolucion === null);
  if (libro.disponible || !prestamo) {
    return error(res, 409, "El libro no está prestado");
  }
  prestamo.fechaDevolucion = new Date().toISOString().slice(0, 10);
  libro.disponible = true;
  res.status(200).json(prestamo);
});

export default router;
