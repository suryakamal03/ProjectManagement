import {createUser,LoginUser} from "../controllers/User.controllers";
import express from "express";
const router = express.Router();
router.post("/register",createUser);
router.post("/login",LoginUser);
export default router;