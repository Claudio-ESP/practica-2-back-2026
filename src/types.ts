export interface Libro {
  id: number;
  titulo: string;
  autor: string;
  año: number;
  disponible: boolean;
}

export interface Prestamo {
  id: number;
  libroId: number;
  usuario: string;
  fechaPrestamo: string;
  fechaDevolucion: string | null;
}
