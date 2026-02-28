import express,{ Request, Response } from "express";
import {Project} from "../models/Project.models";
import { User } from "../models/User.models";

export const createProject = async(req: Request, res: Response) => {
  try {
    const { title, description, } = req.body;
    if(!title || !description) {
      return res.status(400).json({message:"Please fill all the fields"});
    }
    const UserId = (req as any).user.id;
    const newProject = new Project({
      title,
      description,
      createdBy: UserId,
      assignedMembers: [],
    });
    await newProject.save();
    res.status(201).json({message:"Project created successfully", project: newProject
    })

  } catch (error) {
    res.status(500).json({message:"Server error on creating project", error});
  }
}

export const getProjects = async (req: Request, res: Response) => {
  const UserId = (req as any).user.id;
  const userRole = (req as any).user.role;
  try {
    if(!UserId){
      return res.status(401).json({message:"Unauthorized"});
    }
    if(userRole === "Admin" || userRole === "Manager"){
      const projects = await Project.find().populate("createdBy", "name email").populate("assignedMembers", "name email");
      res.status(200).json({projects});
    }else{
      const projects = await Project.find({assignedMembers: UserId}).populate("createdBy", "name email").populate("assignedMembers", "name email");
      res.status(200).json({projects});
    }
    
  } catch (error) {
    res.status(500).json({message:"Server error on fetching projects", error});
  }
}

export const getProjectById = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;
    const projectId = req.params.id;
    const project = await Project.findById(projectId).populate("createdBy", "name email").populate("assignedMembers", "name email");

    if(!project){
      return res.status(404).json({message:"Project not found"});
    }
    if(userRole !== "Admin" && !project.assignedMembers.some((member:any) => member._id.toString() === userId)){
  return res.status(403).json({message:"Access denied"});
}
    res.status(200).json({project});
  } catch (error) {
    res.status(500).json({message:"Server error on fetching project", error});
  }
}

export const updateProject = async(req: Request, res: Response) => {
  try{
    const UserId = (req as any).user.id;
    const userRole = (req as any).user.role;
    if(userRole !== "Admin"){
      return res.status(403).json({message:"Access denied"});
    }
    const { title, description, status } = req.body;
    const updatedProject = await Project.findByIdAndUpdate(req.params.id, { title, description, status }, { new: true }).populate("createdBy", "name email").populate("assignedMembers", "name email");
    if(!updatedProject){
      return res.status(404).json({message:"Project not found"});
    }
    res.status(200).json({message:"Project updated successfully", project: updatedProject});
  }catch(error){
    res.status(500).json({message:"Server error on updating project", error});
  }
}

export const deleteProject = async(req: Request, res: Response) => {
  try {
    const UserId = (req as any).user.id;
    const userRole = (req as any).user.role;
    if(userRole !== "Admin"){
      return res.status(403).json({message:"Access denied"});
    }
    await Project.findByIdAndDelete(req.params.id);
  
    res.status(200).json({message:"Project deleted successfully"});
  } catch (error) {
    res.status(500).json({message:"Server error on deleting project", error});
  }
}

export const assignMember = async(req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;
    const projectId = req.params.id;
    const { memberId } = req.body;
    
    if(!memberId){
      return res.status(400).json({message:"Member ID is required"});
    }
    
    const project = await Project.findById(projectId);
   
    if(!project){
      return res.status(404).json({message:"Project not found"});
    }
    
    if(userRole !== "Admin"){
      return res.status(403).json({message:"Access denied.Admin only."});
    }
    
    // Check if member already exists
    if(project.assignedMembers.some((member: any) => member.toString() === memberId)){
      return res.status(400).json({message:"Member already assigned to this project"});
    }
    
    // Verify the user exists
    const userToAssign = await User.findById(memberId);
    if(!userToAssign){
      return res.status(404).json({message:"User not found"});
    }
   
    project.assignedMembers.push(memberId);
    await project.save();
    
    // Populate the project with user details before sending response
    const populatedProject = await Project.findById(projectId)
      .populate("createdBy", "name email")
      .populate("assignedMembers", "name email");
    
    res.status(200).json({message:"Member assigned to project successfully", project: populatedProject});

  } catch (error) {
    console.error("Error in assignMember:", error);
    res.status(500).json({message:"Server error on assigning member to project", error});
  }
}

