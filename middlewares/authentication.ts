import { Request, Response, NextFunction } from "express";

const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"];
  const validApiKey = process.env.API_KEY;

  if (apiKey === validApiKey) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

export default apiKeyAuth;
