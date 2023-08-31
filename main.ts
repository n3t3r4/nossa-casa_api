import cors from "cors";
import express, { Request, Response } from "express";

const app = express();
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.status(200);
  res.json({
    funfando: true,
  });
});

app.listen(8080, () => {
  console.log("server running");
});
