import mongoose, { Document } from "mongoose";

export interface ITask extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  status: "Todo" | "InProgress" | "Done";
  assignedTo: mongoose.Types.ObjectId;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new mongoose.Schema<ITask>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },

    status: {
      type: String,
      enum: ["Todo", "InProgress", "Done"],
      default: "Todo"
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    dueDate: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>("Task", taskSchema);
