const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

console.log(process.env.API_NAME);

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.API_NAME}:${process.env.API_PASSWORD}@cluster0.qmj3ajj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("blazeEdu").collection("users");
    const teacherApplyCollection = client
      .db("blazeEdu")
      .collection("teacherApply");

    app.post("/user/add", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.post("/teacher/apply", async (req, res) => {
      const user = req.body;

      const query = { teacherEmail: user.teacherEmail };

      const exist = await teacherApplyCollection.findOne(query);

      if (exist) {
        res.send({ message: "Already Applied" });
      } else {
        const result = await teacherApplyCollection.insertOne(user);
        res.send(result);
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
