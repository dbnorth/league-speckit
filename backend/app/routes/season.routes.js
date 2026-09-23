import { Router } from "express";
import seasonController from "../controllers/season.controller.js";
import { authenticate, authenticateAdmin } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], seasonController.findAll);
router.post("/", [authenticateAdmin], seasonController.create);
router.post("/:seasonId/games", [authenticateAdmin], seasonController.createGames);
router.put("/:seasonId", [authenticateAdmin], seasonController.update);
router.delete("/:seasonId", [authenticateAdmin], seasonController.remove);

export default router;
