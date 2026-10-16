import express, { NextFunction, Request, Response } from "express";
import librosRouter from "./routes/libros";
import prestamosRouter from "./routes/prestamos";
import estadisticasRouter from "./routes/estadisticas";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.use("/libros", librosRouter);
app.use("/prestamos", prestamosRouter);
app.use("/estadisticas", estadisticasRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// JSON mal formado u otros errores
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON inválido" });
  }
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
