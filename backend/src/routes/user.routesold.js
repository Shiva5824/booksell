import { Router } from "express";
import { getUser, getUserProducts } from "../controllers/user.controller.js";

const router = Router();

router.get("/:id", getUser);
router.get("/:id/products", getUserProducts);

export default router;
