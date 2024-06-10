import express, { Request, Response } from "express";
import cors from "cors";
import { MongoClient, InsertOneResult } from "mongodb";
import dotenv from "dotenv";

// Init server
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 4000;

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from server!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
