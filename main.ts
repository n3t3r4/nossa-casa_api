import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express, { Request, Response } from "express";

const prisma = new PrismaClient();

const app = express();
app.use(cors());

app.get("/properties", async (req: Request, res: Response) => {
  const minPrice = Number(req.query.minPrice);
  const maxPrice = Number(req.query.maxPrice);
  const limit = Number(req.query.ipp);
  const page = Number(req.query.page);
  const bedrooms = Number(req.query.bedrooms);
  const baths = Number(req.query.baths);
  const subType = String(req.query.subtype);

  const subTypeUpperCase = subType.charAt(0).toUpperCase() + subType.slice(1);

  const data = await prisma.properties.findMany({
    where: {
      sale_value: { gte: minPrice, lte: maxPrice },
      bedrooms: bedrooms,
      bathrooms: baths,
      subtype: subTypeUpperCase,
    },
    take: limit,
    skip: page * limit - limit,
    orderBy: { updated_at: "desc" },
  });

  res.status(200);
  res.json({ properties: data });
});

app.get("/properties/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  const data = await prisma.properties.findUnique({
    where: { identifier_code: id },
  });

  res.status(200);
  res.json(data);
});

app.get("/condominiums", async (req: Request, res: Response) => {
  const limit = Number(req.query.ipp);
  const page = Number(req.query.page);

  const data = await prisma.condominiums.findMany({
    take: limit,
    skip: page * limit - limit,
  });

  res.status(200);
  res.json({ condominiums: data });
});

app.listen(8080, () => {
  console.log("server running");
});
