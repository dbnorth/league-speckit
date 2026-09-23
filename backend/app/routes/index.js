import { Router } from "express";
import authRoutes from "./auth.routes.js";
import leagueRoutes from "./league.routes.js";
import personRoutes from "./person.routes.js";
import teamRoutes from "./team.routes.js";
import userRoutes from "./user.routes.js";
import seasonRoutes from "./season.routes.js";

const router = Router();

router.use("/", authRoutes);
router.use("/leagues", leagueRoutes);
router.use("/people", personRoutes);
router.use("/teams", teamRoutes);
router.use("/users", userRoutes);
router.use("/seasons", seasonRoutes);

export default router;
