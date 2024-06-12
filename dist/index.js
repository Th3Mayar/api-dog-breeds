var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import exp from "express";
import cors from "cors";
import mongoose, { Schema, model } from "mongoose";
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
app.get("/", (req, res) => {
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
const dogSchema = new Schema({
    name: { type: String, required: true },
    breeds: [{ name: { type: String, required: true } }],
    image: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
});
const DogModel = model("Dog", dogSchema);
const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
const UserModel = model("User", userSchema);
// User registration route
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const hashedPassword = yield bcrypt.hash(password, 10);
        const newUser = new UserModel({ username, password: hashedPassword });
        yield newUser.save();
        res.json({ message: "User registered successfully" });
    }
    catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
// User login route
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const user = yield UserModel.findOne({ username });
        if (!user || !(yield bcrypt.compare(password, user.password))) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    }
    catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
// Routes
app.get("/dogs", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dogs = yield DogModel.find();
        res.json(dogs);
    }
    catch (error) {
        console.error("Error fetching dogs from MongoDB:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
app.get("/dogs/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const dog = yield DogModel.findById(id);
        if (!dog) {
            res.status(404).json({ message: "Dog not found" });
            return;
        }
        res.json(dog);
    }
    catch (error) {
        console.error("Error fetching dog from MongoDB:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
// Protected routes
app.post("/dogs", authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, breeds, image } = req.body;
    try {
        const newDog = new DogModel({ name, breeds, image });
        const savedDog = yield newDog.save();
        res.json({
            message: "Data received and saved successfully",
            data: savedDog._id,
        });
    }
    catch (error) {
        console.error("Error inserting document into MongoDB:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
app.delete("/dogs/:id", authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deleteResult = yield DogModel.findByIdAndDelete(id);
        if (!deleteResult) {
            res.status(404).json({ message: "Dog not found" });
            return;
        }
        res.json({ message: "Dog deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting dog from MongoDB:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
app.put("/dogs/:id", authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, breeds, image } = req.body;
    try {
        const updateResult = yield DogModel.findByIdAndUpdate(id, {
            name,
            breeds,
            image,
            updatedAt: new Date(),
        }, { new: true });
        if (!updateResult) {
            res.status(404).json({ message: "Dog not found" });
            return;
        }
        res.json({ message: "Dog updated successfully" });
    }
    catch (error) {
        console.error("Error updating dog in MongoDB:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});
