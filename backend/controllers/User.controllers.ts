import {User} from "../models/User.models";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
export const createUser = async(req: Request, res: Response)=>{
  try {
    const {name,email,password} = req.body;
    if(!name || !email || !password){
      return res.status(400).json({message:"Please fill all the fields"});
    }
    const existingUser = await User.findOne({email});
    if(existingUser){
      return res.status(400).json({message:"User already exists"});
    }
    const salted = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,salted);
    let role = "Member";
    if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
      role = "Admin";
    }
    if(email === process.env.MANAGER_EMAIL && password === process.env.MANAGER_PASSWORD){
      role = "Manager";
    }
    const newUser = new User({
      name,
      email,
      password:hashedPassword,
      role:role
    });
    
    await newUser.save();
       const token = jwt.sign(
  { id: newUser._id, role: newUser.role },
  process.env.JWT_SECRET as string,
  { expiresIn: "7d" }
);

    res.status(201).json({message:"User created successfully",id:newUser._id,name:newUser.name,email:newUser.email, role:newUser.role, token});
  } catch (error) {
    res.status(500).json({message:"Server error on creating user account",error});
  }
}

export const LoginUser = async(req: Request, res: Response)=>{
  try {
    const {email,password} = req.body;
    if(!email || !password){
      return res.status(400).json({message:"Please fill all the fields"});
    }
    const existingUser = await User.findOne({email:email});
    if(!existingUser){
      return res.status(400).json({message:"User does not exist"});
    }
    const isPasswordMatch = await bcrypt.compare(password,existingUser.password);
    if(!isPasswordMatch){
      return res.status(400).json({message:"Invalid credentials"});
    }
     const token = jwt.sign(
      { id: existingUser._id, role: existingUser.role },
      process.env.JWT_SECRET as string, 
      { expiresIn: "7d" }
    );
    res.status(200).json({message:"User logged in successfully",id:existingUser._id,name:existingUser.name,email:existingUser.email, role:existingUser.role, token});
  } catch (error) {
    res.status(500).json({message:"Server error on logging in user",error});
  }
}

export const getAllUsers = async(req: Request, res: Response)=>{
  try {
    const users = await User.find().select("-password");
    res.status(200).json({message:"Users fetched successfully", users});
  } catch (error) {
    res.status(500).json({message:"Server error on fetching users",error});
  }
}

export const adminCreateUser = async(req: Request, res: Response)=>{
  try {
    const {name, email, password, role} = req.body;
    if(!name || !email || !password || !role){
      return res.status(400).json({message:"Please fill all the fields"});
    }
    if(role !== "Admin" && role !== "Member"){
      return res.status(400).json({message:"Invalid role. Must be Admin or Member"});
    }
    const existingUser = await User.findOne({email});
    if(existingUser){
      return res.status(400).json({message:"User already exists"});
    }
    const salted = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salted);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role
    });
    await newUser.save();
    res.status(201).json({
      message:"User created successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({message:"Server error on creating user",error});
  }
}

export const updateUserRole = async(req: Request, res: Response)=>{
  try {
    const userId = req.params.id;
    const {role} = req.body;
    if(!role){
      return res.status(400).json({message:"Role is required"});
    }
    if(role !== "Admin" && role !== "Member"){
      return res.status(400).json({message:"Invalid role. Must be Admin or Member"});
    }
    const user = await User.findById(userId);
    if(!user){
      return res.status(404).json({message:"User not found"});
    }
    user.role = role;
    await user.save();
    res.status(200).json({
      message:"User role updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({message:"Server error on updating user role",error});
  }
}

export const deleteUser = async(req: Request, res: Response)=>{
  try {
    const userId = req.params.id;
    const currentUserId = (req as any).user.id;
    
    if(userId === currentUserId){
      return res.status(400).json({message:"You cannot delete your own account"});
    }
    
    const user = await User.findById(userId);
    if(!user){
      return res.status(404).json({message:"User not found"});
    }
    
    await User.findByIdAndDelete(userId);
    res.status(200).json({message:"User deleted successfully"});
  } catch (error) {
    res.status(500).json({message:"Server error on deleting user",error});
  }
}

