import express,{Request,Response} from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import userRouter from './routes/user.routes';
import projectRouter from './routes/project.routes';
import taskRouter from './routes/task.routes';
import aiRouter from './routes/ai.routes';
import dotenv from 'dotenv';
dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5174', 
    'http://localhost:3000',
    'https://project-management-ruby-five.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());
const MONGODB_URL = process.env.MONGODB_URL || "Error: MONGODB_URL not found in environment variables";
const connectDB = async () =>{
  try {
    const conn = await mongoose.connect(MONGODB_URL);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("error in connecting MONGODB",error)
  }
}
app.use("/api/user",userRouter);
app.use("/api/project",projectRouter);
app.use("/api/project",taskRouter);
app.use("/api/ai", aiRouter);
app.listen(PORT,()=>{
  console.log("The server is running",PORT);
  connectDB();
})


