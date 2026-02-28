import {createProject,getProjects,getProjectById,updateProject,deleteProject,assignMember} from "../controllers/Project.controllers";
import express from "express";
import { isAdmin,isManager } from "../middleware/role.middleware";
import {authMiddleware} from "../middleware/user.middleware";
const router = express.Router();
router.post("/create",authMiddleware,isAdmin,createProject);
router.get("/all",authMiddleware,getProjects);
router.get("/:id",authMiddleware,getProjectById);
router.put("/:id",authMiddleware,isAdmin,updateProject);
router.put("/:id",authMiddleware,isManager,updateProject);
router.delete("/:id",authMiddleware,isAdmin,deleteProject);
router.post("/:id/assign-member",authMiddleware,isAdmin,assignMember);

export default router;