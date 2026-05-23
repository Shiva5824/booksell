import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const productQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    q: z.string().optional(),
    college: z.string().optional(),
    category: z.enum(["ipe", "eapcet", "jee", "neet"]).optional(),
    min: z.coerce.number().min(0).optional(),
    max: z.coerce.number().min(0).optional(),
    sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
    limit: z.coerce.number().min(1).max(50).optional(),
    skip: z.coerce.number().min(0).optional()
  })
});

export const productIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: objectId }),
  query: z.object({}).optional()
});

export const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(120),
    price: z.number().min(0),
    condition: z.enum(["new", "good", "used"]),
    category: z.enum(["ipe", "eapcet", "jee", "neet"]),
    images: z.array(z.string().url()).min(1).max(6),
    description: z.string().min(3).max(2000),
    college: z.string().max(500).optional(),
    location: z.object({
      address: z.string().min(1).max(500),
      latitude: z.number(),
      longitude: z.number()
    }).optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updateProductSchema = z.object({
  body: createProductSchema.shape.body.partial().extend({
    status: z.enum(["active", "sold"]).optional()
  }),
  params: z.object({ id: objectId }),
  query: z.object({}).optional()
});
