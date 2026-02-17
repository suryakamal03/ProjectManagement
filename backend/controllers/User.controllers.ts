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