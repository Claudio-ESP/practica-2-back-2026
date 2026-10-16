import { Router } from "express";
import { prestamos } from "../data";

const router = Router();

// GET /prestamos?usuario=nombre&activos=true
router.get("/", (req, res) => {
  const { usuario, activos } = req.query;
  let resultado = prestamos;
  if (typeof usuario === "string") {
    resultado = resultado.filter((p) => p.usuario.toLowerCase() === usuario.toLowerCase());
  }
  if (activos === "true") {
    resultado = resultado.filter((p) => p.fechaDevolucion === null);
  }
  res.status(200).json(resultado);
});

export default router;
