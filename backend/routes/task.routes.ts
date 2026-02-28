import { createTask,getTasks,getTaskById,updateTask,deleteTask } from "../controllers/Task.controllers";
import express from "express";
import { authMiddleware } from "../middleware/user.middleware";
import { isAdmin,isManager } from "../middleware/role.middleware";
const router = express.Router();

router.post("/:projectId/tasks", authMiddleware, createTask);
router.get("/:projectId/tasks", authMiddleware, getTasks);
router.get("/:projectId/tasks/:id", authMiddleware, getTaskById);
router.put("/:projectId/tasks/:id", authMiddleware,isManager, updateTask);
router.delete("/:projectId/tasks/:id", authMiddleware,isAdmin, deleteTask);

export default router;