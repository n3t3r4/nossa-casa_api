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
  const garages = req.query.garages ? Number(req.query.garages) : undefined;
  const minArea = req.query.minArea ? String(req.query.minArea) : undefined;
  const maxArea = req.query.maxArea ? String(req.query.maxArea) : undefined;
  const search = req.query.search ? String(req.query.search) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;
  const furnished = req.query.furnished
    ? Number(req.query.furnished)
    : undefined;

  const exclusive = req.query.exclusive
    ? Boolean(req.query.exclusive)
    : Boolean(false);

  const withVideo =
    req.query.withVideo === "true"
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

  const orderBy = req.query.orderBy ? Number(req.query.orderBy) : 0;

  try {
    const numberResults = await prisma.properties.count({
      where: {
        ...(search !== undefined
          ? {
              OR: [
                { identifier_code: { contains: search, mode: "insensitive" } },

                { condominium_name: { contains: search, mode: "insensitive" } },
              ],
            }
          : undefined),

        sale_value: { gte: minPrice, lte: maxPrice },
        bedrooms: bedrooms,
        bathrooms: baths,
        garages: garages,
        furnished: furnished,
        building_status: { contains: status, mode: "insensitive" },
        total_area: { gt: minArea, lt: maxArea },

        ...(exclusive === true ? { has_exclusivity: true } : undefined),

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
    });
    const data = await prisma.properties.findMany({
      where: {
        ...(search !== undefined
          ? {
              OR: [
                { identifier_code: { contains: search, mode: "insensitive" } },

                { condominium_name: { contains: search, mode: "insensitive" } },
              ],
            }
          : undefined),

        sale_value: { gte: minPrice, lte: maxPrice },
        bedrooms: bedrooms,
        bathrooms: baths,
        garages: garages,
        furnished: furnished,
        building_status: { contains: status, mode: "insensitive" },
        total_area: { gt: minArea, lt: maxArea },

        ...(exclusive === true ? { has_exclusivity: true } : undefined),

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
      orderBy: {
        ...(orderBy === 0 ? { updated_at: "desc" } : null),
        ...(orderBy === 1 ? { sale_value: "desc" } : null),
        ...(orderBy === 2 ? { sale_value: "asc" } : null),
        ...(orderBy === 3
          ? { total_area: { sort: "desc", nulls: "last" } }
          : null),
      },
    });

    res.status(200);
    res.json({ properties: data, numberResults: numberResults });
  } catch (e) {
    console.log(e);
    res.status(500);
    res.json({ message: "Error" });
  }
});

app.get("/properties/:id", async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const data = await prisma.properties.findUnique({
      where: { identifier_code: id },
    });

    const relativeProperties = await prisma.properties.findMany({
      where: {
        subtype: data?.subtype,
        neighborhood_id: data?.neighborhood_id,
        sale_value: { gte: Number(data?.sale_value) - 200000 },
      },
      take: 6,
    });

    res.status(200);
    res.json({ data: data, relativeProperties: relativeProperties });
  } catch (e) {
    console.log(e);
    res.status(500);
    res.json({ message: "Error" });
  }
});

app.get("/condominiums", async (req: Request, res: Response) => {
  const limit = req.query.ipp ? Number(req.query.ipp) : 10;
  const page = req.query.page ? Number(req.query.page) : 1;

  try {
    const data = await prisma.condominiums.findMany({
      where: {
        launch: true,
      },
      take: limit,
      skip: page * limit - limit,
      orderBy: { created_at: "desc" },
    });

    res.status(200);
    res.json({ condominiums: data });
  } catch (e) {
    console.log(e);
    res.status(500);
    res.json({ message: "Error" });
  }
});

app.get("/condominiums/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    let data = await prisma.condominiums.findUnique({
      where: { id: Number(id) },
    });

    let units = await prisma.properties.findMany({
      where: {
        condominium_name: { contains: data?.name, mode: "insensitive" },
      },
    });

    res.status(200);
    res.json({ condominium: data, avaible_units: units });
  } catch (e) {
    console.log(e);
    res.status(500);
    res.json({ message: "Error" });
  }
});

app.get("/", (req: Request, res: Response) => {
  res.json({ sucess: true });
  res.status(200);
});

app.listen(8080, () => {
  console.log("server running");
});
