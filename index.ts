import exp, { type Request, type Response } from "express";
import cors from "cors";
import mongoose, { Schema, model, Document } from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { expressjwt } from "express-jwt";

// Init server
dotenv.config();

const app = exp();

app.use(exp.json());
app.use(cors());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "";

// Middleware to check for JWT in protected routes
const authMiddleware = expressjwt({
  secret: JWT_SECRET,
  algorithms: ["HS256"],
});

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from server!" });
});

// Connect to MongoDB using Mongoose
const MONGODB_URL = process.env.MONGODB_URI || "";

mongoose.connect(MONGODB_URL).then(() => {
  console.log("Connected to MongoDB with Mongoose");
}).catch((error) => {
  console.error("Error connecting to MongoDB with Mongoose:", error);
  process.exit(1);
});

// Define Dog interface and schema
interface Dog extends Document {
  name: string;
  breeds: { name: string }[];
  image: string;
  createdAt: Date;
  updatedAt?: Date;
}

const dogSchema = new Schema<Dog>({
  name: { type: String, required: true },
  breeds: [{ name: { type: String, required: true } }],
  image: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

const DogModel = model<Dog>("Dog", dogSchema);

// Define User interface and schema
interface User extends Document {
  username: string;
  password: string;
}

const userSchema = new Schema<User>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const UserModel = model<User>("User", userSchema);

// User registration route
app.post("/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({ username, password: hashedPassword });
    await newUser.save();

    res.json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// User login route
app.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await UserModel.findOne({ username });

    if (!user || !await bcrypt.compare(password, user.password)) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Routes
app.get("/dogs", async (_req: Request, res: Response) => {
  try {
    const dogs = await DogModel.find();
    res.json(dogs);
  } catch (error) {
    console.error("Error fetching dogs from MongoDB:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/dogs/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const dog = await DogModel.findById(id);

    if (!dog) {
      res.status(404).json({ message: "Dog not found" });
      return;
    }

    res.json(dog);
  } catch (error) {
    console.error("Error fetching dog from MongoDB:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Protected routes
app.post("/dogs", authMiddleware, async (req: Request, res: Response) => {
  const { name, breeds, image } = req.body;

  try {
    const newDog = new DogModel({ name, breeds, image });
    const savedDog = await newDog.save();

    res.json({
      message: "Data received and saved successfully",
      data: savedDog._id,
    });
  } catch (error) {
    console.error("Error inserting document into MongoDB:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/dogs/:id", authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deleteResult = await DogModel.findByIdAndDelete(id);

    if (!deleteResult) {
      res.status(404).json({ message: "Dog not found" });
      return;
    }

    res.json({ message: "Dog deleted successfully" });
  } catch (error) {
    console.error("Error deleting dog from MongoDB:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/dogs/:id", authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, breeds, image } = req.body;

  try {
    const updateResult = await DogModel.findByIdAndUpdate(
      id,
      {
        name,
        breeds,
        image,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updateResult) {
      res.status(404).json({ message: "Dog not found" });
      return;
    }

    res.json({ message: "Dog updated successfully" });
  } catch (error) {
    console.error("Error updating dog in MongoDB:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});