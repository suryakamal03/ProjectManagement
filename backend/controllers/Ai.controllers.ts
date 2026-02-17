import {Request,Response} from 'express';
import { AIService } from '../services/ai.service';
import { Project } from '../models/Project.models';
import { Task } from '../models/Task.models';

export const generateDescription = async(req: Request, res: Response) => {
  try {
    const { title } = req.body;
    if(!title) {
      res.status(400).json({message:"Title is required to generate description"});
      return;
    }
    const description = await AIService.generateTaskDescription(title);
    res.json({ description });
  } catch (error) {
    res.status(500).json({message:"Server error on generating description", error});
  }
}

export const SuggestPriority = async(req: Request, res: Response) => {
  try {
    const {description,title} = req.body;
    if(!description || !title) {
      res.status(400).json({message:"Title and description are required to suggest priority"});
      return;
    }
    const priority = await AIService.suggestPriority(title, description);
    res.json({ priority });
  } catch (error) {
    res.status(500).json({message:"Server error on suggesting priority", error});
    console.log(error);
  }
}

export const generateSummary = async(req: Request, res: Response) => {
    try {
      const { projectId } = req.body;
      
      if (!projectId) {
        res.status(400).json({ message: "Project ID is required" });
        return;
      }
      
      const project = await Project.findById(projectId);
      
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      const tasks = await Task.find({ projectId });
      
      const taskData = tasks.map(task => ({
        title: task.title,
        status: task.status
      }));
      
      const summary = await AIService.generateSummary({
        title: project.title,
        description: project.description,
        tasks: taskData
      });
      
      res.json({ summary });
    } catch (error) {
      res.status(500).json({message:"Server error on generating summary", error});
      console.log(error);
    }

  }

const calculateContributors = (completedTasks: any[]): string => {
  const contributorMap = new Map<string, number>();
  
  completedTasks.forEach(task => {
    const contributorName = task.assignedTo?.name || 'Unknown';
    contributorMap.set(contributorName, (contributorMap.get(contributorName) || 0) + 1);
  });
  
  const sorted = Array.from(contributorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${name} (${count} tasks)`);
  
  return sorted.join(', ') || 'No contributors';
};

export const generateWeeklyReport = async(req: Request, res: Response) => {
    try {
      const { projectId } = req.body;
      
      if (!projectId) {
        res.status(400).json({ message: "Project ID is required" });
        return;
      }
      
      const project = await Project.findById(projectId).populate('assignedMembers');
      
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      
      const tasks = await Task.find({ projectId }).populate('assignedTo');
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const completedThisWeek = tasks.filter(t => 
        t.status === 'Done' && t.updatedAt >= weekAgo
      );
      
      const overdueTasks = tasks.filter(t => 
        t.dueDate < new Date() && t.status !== 'Done'
      );
      
      const topContributors = calculateContributors(completedThisWeek);
      
      const priorityBreakdown = {
        high: tasks.filter(t => t.priority === 'High').length,
        medium: tasks.filter(t => t.priority === 'Medium').length,
        low: tasks.filter(t => t.priority === 'Low').length
      };
      const report = await AIService.generateWeeklyReport({
        projectTitle: project.title,
        tasksCompleted: completedThisWeek.length,
        overdueTasks: overdueTasks.length,
        topContributors,
        priorityBreakdown
      });
      
      res.json({ report });
    } catch (error) {
      res.status(500).json({message:"Server error on generating weekly report", error});
    }
  }
