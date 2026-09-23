import { Router } from "express";
import personController from "../controllers/person.controller.js";
import { authenticate, authenticateAdmin } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], personController.findAll);
router.post("/", [authenticateAdmin], personController.create);
router.put("/:personId", [authenticateAdmin], personController.update);
router.delete("/:personId", [authenticateAdmin], personController.remove);

export default router;
