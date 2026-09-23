import { Router } from "express";
import leagueController from "../controllers/league.controller.js";
import { authenticate, authenticateAdmin } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], leagueController.findAll);
router.post("/", [authenticateAdmin], leagueController.create);
router.put("/:leagueId", [authenticateAdmin], leagueController.update);
router.delete("/:leagueId", [authenticateAdmin], leagueController.remove);

export default router;
