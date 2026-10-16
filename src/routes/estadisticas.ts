import { Router } from "express";
import { libros } from "../data";

const router = Router();

router.get("/", (_req, res) => {
  const disponibles = libros.filter((l) => l.disponible).length;

  const conteo = new Map<string, number>();
  for (const l of libros) conteo.set(l.autor, (conteo.get(l.autor) ?? 0) + 1);
  let autorConMasLibros: string | null = null;
  let max = 0;
  for (const [autor, n] of conteo) {
    if (n > max) {
      max = n;
      autorConMasLibros = autor;
    }
  }

  res.status(200).json({
    totalLibros: libros.length,
    disponibles,
    prestados: libros.length - disponibles,
    autorConMasLibros
  });
});

export default router;
