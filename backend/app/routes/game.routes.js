import { Router } from "express";
import gameController from "../controllers/game.controller.js";
import { authenticate, authenticateAdmin } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], gameController.findAll);
router.post("/", [authenticateAdmin], gameController.create);
router.put("/:gameId", [authenticateAdmin], gameController.update);
router.delete("/:gameId", [authenticateAdmin], gameController.remove);

export default router;
