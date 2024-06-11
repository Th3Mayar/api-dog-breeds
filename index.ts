import exp, { type Request, type Response } from "express";
import cors from "cors";
import { MongoClient, InsertOneResult, ObjectId } from "mongodb";
import dotenv from "dotenv";

// Init server
dotenv.config();

const app = exp();

app.use(exp.json());
app.use(cors());

const PORT = process.env.PORT || 4000;

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from server!" });
});

app.get("/dogs", async (_req: Request, res: Response) => {
  try {
    const database = client.db("dogs-breeds");
    const collection = database.collection("dogs");

    const dogs = await collection.find().toArray();

    res.json(dogs);
  } catch (error) {
    console.error("Error fetching dogs from MongoDB:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/dogs/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const database = client.db("dogs-breeds");
    const collection = database.collection("dogs");

    const dog = await collection.findOne({ _id: new ObjectId(id) });

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

app.get("/dogs/:name", async (req: Request, res: Response) => {
  const { name } = req.params;

  try {
    const database = client.db("dogs-breeds");
    const collection = database.collection("dogs");

    const dog = await collection.findOne({ name }, { sort: { createdAt: -1 } });
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

const MONGODB_URL = process.env.MONGODB_URI || "";

const client = new MongoClient(MONGODB_URL, {
  tlsAllowInvalidCertificates: true,
  serverSelectionTimeoutMS: 50000,
});

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB cluster");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

connectToMongoDB();

app.use(exp.urlencoded({ extended: true }));

app.post("/dogs", async (req: Request, res: Response) => {
  const {
    name, 
    breeds,
    image,
  } = req.body;
  console.log(`Received name: ${name}, breeds: ${breeds.map((breed: { name: any; }) => breed.name)}, image: ${image}`);

  try {
    const database = client.db("dogs-breeds");
    const collection = database.collection("dogs");

    const insertResult: InsertOneResult = await collection.insertOne({
      name,
      breeds,
      image,
      createdAt: new Date(),
    });

    res.json({
      dogs: "Data received and saved successfully",
      data: insertResult.insertedId,
    });
  } catch (error) {
    console.error("Error inserting document into MongoDB:", error);
    res.status(500).json({ dogs: "Internal Server Error" });
  }
});

app.delete("/dogs/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const database = client.db("dogs-breeds");
    const collection = database.collection("dogs");

    const deleteResult = await collection.deleteOne({ _id: new ObjectId(id) });

    if (deleteResult.deletedCount === 0) {
      res.status(404).json({ message: "Dog not found" });
      return;
    }

    res.json({ message: "Dog deleted successfully" });
  } catch (error) {
    console.error("Error deleting dog from MongoDB:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/dogs/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, breeds, image } = req.body;

  try {
    const database = client.db("dogs-breeds");
    const collection = database.collection("dogs");

    const updateResult = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          breeds,
          image,
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
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
