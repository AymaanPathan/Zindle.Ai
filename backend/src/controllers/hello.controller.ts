import { Request, Response } from "express";

export const sayHello = (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: "Hello, World!",
    timestamp: new Date().toISOString(),
  });
};
