import { Router } from "express";
import { login, me } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema } from "../validators/auth.schema.js";

const router = Router();

router.post("/login", requireAuth, validate(loginSchema), login);
router.get("/me", requireAuth, me);

export default router;


