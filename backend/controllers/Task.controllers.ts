import { Task } from "../models/Task.models";
import { Request, Response } from "express";
import { Project } from "../models/Project.models";


export const createTask = async(req: Request, res: Response) => {
  try{
    const ProjectId = req.params.projectId;
    const userRole = (req as any).user.role;
    const project = await Project.findById(ProjectId);
    const userId = (req as any).user.id;
    const { title, description, assignedTo,priority,status,dueDate } = req.body;
    if(!title || !description || !assignedTo || !priority || !status || !dueDate){
      return res.status(400).json({message:"Please fill all the fields,task creation failed"});
    }
    if(!project){
  return res.status(404).json({message:"Project not found"});
}
    if(userRole !== "Admin" && !project.assignedMembers.some((member:any) => member.toString() === userId)){
  return res.status(403).json({message:"Access denied"});
}
    const newTask = new Task({
      projectId: ProjectId,
      title,
      description,
      assignedTo,
      priority,
      status,
      dueDate
    });
    await newTask.save();
    res.status(201).json({message:"Task created successfully", task:newTask});
  }catch(error){
    res.status(500).json({message:"Server error on creating task", error});
    console.error("Task creation error:", error);
  }
}

export const getTasks = async(req: Request, res: Response) => {
  try {
    const ProjectId = req.params.projectId;
    const project = await Project.findById(ProjectId);
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;
    if(!project){
  return res.status(404).json({message:"Project not found"});
}
if(userRole !== "Admin" && !project.assignedMembers.some((member:any) => member.toString() === userId)){
  return res.status(403).json({message:"Access denied"});
}

    const tasks = await Task.find({projectId: ProjectId}).populate("assignedTo", "name email");

    res.status(200).json({tasks});
  } catch (error) {
    res.status(500).json({message:"Server error on fetching tasks", error});
  }
}

export const getTaskById = async(req: Request, res: Response) => {
  try{
    const taskId = req.params.id;
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;
    const task = await Task.findById(taskId).populate("assignedTo", "name email");
    if(!task){
      return res.status(404).json({message:"Task not found"});
    }
    if(userRole !== "Admin" && task.assignedTo._id.toString() !== userId){
      return res.status(403).json({message:"Access denied"});
    }
    res.status(200).json({task});
  }catch(error){
    res.status(500).json({message:"Server error on fetching task", error});
  }
}

export const updateTask = async(req: Request, res: Response) => {
  try{
    const taskId = req.params.id;
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;
    const task = await Task.findById(taskId);
    if(!task){
      return res.status(404).json({message:"Task not found"});
    }
    if(userRole !== "Admin" && task.assignedTo.toString() !== userId){
      return res.status(403).json({message:"Access denied"});
    }
    const { title, description, assignedTo, priority, status, dueDate } = req.body;
    const updatedTask = await Task.findByIdAndUpdate(taskId, { title, description, assignedTo, priority, status, dueDate }, { new: true }).populate("assignedTo", "name email");
    res.status(200).json({message:"Task updated successfully", task: updatedTask});
  }catch(error){
    res.status(500).json({message:"Server error on updating task", error});
  }
}

export const deleteTask = async(req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const userRole = (req as any).user.role;
    const userId = (req as any).user.id;
    const task = await Task.findById(taskId);
    if(!task){
      return res.status(404).json({message:"Task not found"});
    }
    if(userRole !== "Admin"){
      return res.status(403).json({message:"Access denied"});
    }
    await Task.findByIdAndDelete(taskId);
    res.status(200).json({message:"Task deleted successfully"});
  } catch (error) {
    res.status(500).json({message:"Server error on deleting task", error});
  }
}