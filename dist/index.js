import exp from "express";
import cors from "cors";
import dotenv from "dotenv";
// Init server
dotenv.config();
const app = exp();
app.use(exp.json());
app.use(cors());
const PORT = process.env.PORT || 4000;
app.get("/", (req, res) => {
    res.json({ message: "Hello from server!" });
});
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});
