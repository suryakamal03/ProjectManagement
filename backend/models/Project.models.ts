import mongoose, { Document } from "mongoose";

export interface IProject extends Document {
  title: string;  
  description: string;
  createdBy: mongoose.Types.ObjectId;  
  assignedMembers: mongoose.Types.ObjectId[];  
  status: "Active" | "Completed";
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new mongoose.Schema<IProject>(
  {
    title: {  
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedMembers: [  
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    status: {
      type: String,
      enum: ["Active", "Completed"],
      default: "Active"
    }
  },
  { timestamps: true }
);

export const Project = mongoose.model<IProject>("Project", projectSchema);