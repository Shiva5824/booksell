import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct
} from "../controllers/product.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createProductSchema,
  productIdSchema,
  productQuerySchema,
  updateProductSchema
} from "../validators/product.schema.js";

const router = Router();

router.get("/", validate(productQuerySchema), listProducts);
router.get("/:id", validate(productIdSchema), getProduct);
router.post("/", requireAuth, validate(createProductSchema), createProduct);
router.put("/:id", requireAuth, validate(updateProductSchema), updateProduct);
router.delete("/:id", requireAuth, validate(productIdSchema), deleteProduct);

export default router;
