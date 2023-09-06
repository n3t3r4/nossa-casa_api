import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express, { Request, Response } from "express";

const prisma = new PrismaClient();

const app = express();
app.use(cors());

app.get("/properties", async (req: Request, res: Response) => {
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : 0;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : 10000000;
  const limit = req.query.ipp ? Number(req.query.ipp) : 12;
  const page = req.query.page ? Number(req.query.page) : 1;
  const bedrooms = req.query.bedrooms ? Number(req.query.bedrooms) : undefined;
  const baths = req.query.baths ? Number(req.query.baths) : undefined;
  const minArea = req.query.minArea ? String(req.query.minArea) : undefined;
  const withVideo = req.query.withVideo
    ? Boolean(req.query.withVideo)
    : Boolean(false);

  const neighborhood = req.query.neighborhood
    ? String(req.query.neighborhood).split(",").length > 1
      ? String(req.query.neighborhood)
          .split(",")
          .map((item) => Number(`${item}`))
      : Number(`${req.query.neighborhood}`)
    : undefined;

  const subtype = req.query.subtype
    ? String(req.query.subtype).split(",").length > 1
      ? String(req.query.subtype)
          .split(",")
          .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
      : String(req.query.subtype).charAt(0).toUpperCase() +
        String(req.query.subtype).slice(1)
    : undefined;

  console.log(withVideo ? "sim" : "nao");

  const data = await prisma.properties.findMany({
    where: {
      sale_value: { gte: minPrice, lte: maxPrice },
      bedrooms: bedrooms,
      bathrooms: baths,
      total_area: { gte: minArea },

      ...(withVideo === true ? { videos: { not: [] } } : undefined),

      ...(neighborhood instanceof Array
        ? { neighborhood_id: { in: neighborhood } }
        : { neighborhood_id: neighborhood }),

      ...(subtype instanceof Array
        ? {
            subtype: { in: subtype },
          }
        : { subtype: subtype }),
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
