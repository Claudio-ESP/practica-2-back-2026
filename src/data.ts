import { Libro, Prestamo } from "./types";

export let libros: Libro[] = [
  { id: 1, titulo: "Clean Code", autor: "Robert C. Martin", año: 2008, disponible: true },
  { id: 2, titulo: "El Quijote", autor: "Miguel de Cervantes", año: 1605, disponible: true },
  { id: 3, titulo: "Sapiens", autor: "Yuval Noah Harari", año: 2011, disponible: false }
];

export let prestamos: Prestamo[] = [
  { id: 1, libroId: 3, usuario: "Ana", fechaPrestamo: "2026-10-01", fechaDevolucion: null }
];

// Contadores autoincrementales: nunca reutilizan ids de recursos borrados
let siguienteLibroId = Math.max(...libros.map((l) => l.id)) + 1;
let siguientePrestamoId = Math.max(...prestamos.map((p) => p.id)) + 1;

export const nuevoLibroId = () => siguienteLibroId++;
export const nuevoPrestamoId = () => siguientePrestamoId++;

export function eliminarLibro(id: number): void {
  libros = libros.filter((l) => l.id !== id);
}
