import { Router } from "express";
import teamController from "../controllers/team.controller.js";
import { authenticate, authenticateAdmin } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], teamController.findAll);
router.post("/", [authenticateAdmin], teamController.create);
router.put("/:teamId", [authenticateAdmin], teamController.update);
router.delete("/:teamId", [authenticateAdmin], teamController.remove);
router.get("/:teamId/players", [authenticate], teamController.findPlayers);
router.post("/:teamId/players", [authenticateAdmin], teamController.createPlayer);
router.put("/:teamId/players/:playerId", [authenticateAdmin], teamController.updatePlayer);
router.delete("/:teamId/players/:playerId", [authenticateAdmin], teamController.removePlayer);

export default router;
