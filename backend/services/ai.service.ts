import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export class AIService {
  static async generateTaskDescription(title: string): Promise<string> {
    try {
      const prompt = `You are a helpful project management assistant. Generate a clear, concise, and actionable task description (2-3 sentences) for this task: "${title}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      return response.text || "Complete the task as described.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return `Complete the task: ${title}. Ensure quality standards are met.`;
    }
  }

  static async suggestPriority(description: string, title: string): Promise<string> {
    try {
      const prompt = `You are a project management assistant. Based on the task title "${title}" and its description "${description}", suggest a priority level (Low,Medium,High) for this task. Consider factors like urgency, impact, and dependencies.`;
      const response = await ai.models.generateContent({
        model:"gemini-3-flash-preview",
        contents: prompt,
      });
      const priority = response.text?.trim().toLowerCase();
      if (priority === "high" || priority === "medium" || priority === "low") {
        return priority.charAt(0).toUpperCase() + priority.slice(1);
      }
      return "Medium";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Medium";
    }
  }
  
  static async generateSummary(projectData:{ title: string; description: string; tasks: { title: string; status: string }[] }): Promise<string> {
    try {
      const prompt = `You are a project management assistant. Summarize the current status of the project "${projectData.title}" based on its description and tasks. The project description is: "${projectData.description}". The tasks are: ${projectData.tasks.map(task => `Task: "${task.title}", Status: "${task.status}"`).join("; ")}. Provide a concise summary highlighting key points and overall progress.`;
      const response = await ai.models.generateContent({
        model:"gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text || "Project summary not available.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Project summary not available.";
    }
  }

  static async generateWeeklyReport(data: {
    projectTitle: string;
    tasksCompleted: number;
    overdueTasks: number;
    topContributors: string;
    priorityBreakdown: { high: number; medium: number; low: number };
  }): Promise<string> {
    try{
      const prompt = `You are a project management assistant. Generate a weekly report for the project "${data.projectTitle}". This week, ${data.tasksCompleted} tasks were completed. There are ${data.overdueTasks} overdue tasks. The top contributors this week are: ${data.topContributors}. The priority breakdown of tasks is: High - ${data.priorityBreakdown.high}, Medium - ${data.priorityBreakdown.medium}, Low - ${data.priorityBreakdown.low}. Provide a concise summary of the project's current status and any recommendations for the upcoming week.`;
      const response = await ai.models.generateContent({
        model:"gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text || "Weekly report not available.";
    }catch(error){
      console.error("Gemini API Error:", error);
      return "Weekly report not available.";
    }
  }
}
