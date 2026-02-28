import { Request, Response, NextFunction } from "express";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user; 
  if (!user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (user.role !== "Admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};
export const isManager = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user; 
  if (!user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (user.role !== "Manager") {
    return res.status(403).json({ message: "Access denied. Manager only." });
  }
  next();
}