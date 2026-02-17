import { createTask,getTasks,getTaskById,updateTask,deleteTask } from "../controllers/Task.controllers";
import express from "express";
import { authMiddleware } from "../middleware/user.middleware";

const router = express.Router();

router.post("/:projectId/tasks", authMiddleware, createTask);
router.get("/:projectId/tasks", authMiddleware, getTasks);
router.get("/:projectId/tasks/:id", authMiddleware, getTaskById);
router.put("/:projectId/tasks/:id", authMiddleware, updateTask);
router.delete("/:projectId/tasks/:id", authMiddleware, deleteTask);

export default router;