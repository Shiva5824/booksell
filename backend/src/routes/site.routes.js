import { Router } from "express";
import { getSiteContact } from "../controllers/site.controller.js";

const router = Router();

router.get("/contact", getSiteContact);

export default router;
