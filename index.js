const express = require("express");
const cors = require("cors");
const { ObjectId } = require("mongodb");

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
    const classCollection = client.db("blazeEdu").collection("class");
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
        res.send([result, { message: "Apply Success" }]);
      }
    });
    // get the user with params for checking who the hell is user is
    app.get("/user/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { email: id };
        const result = await userCollection.findOne(query);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    // get all user for admin
    app.get("/users", async (req, res) => {
      try {
        const data = await userCollection.find();
        const result = await data.toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    // teacher request
    app.get("/teacher/request", async (req, res) => {
      try {
        const data = await teacherApplyCollection.find();
        const result = await data.toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    // Make Admin
    app.put("/admin/make/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { email: id };

      const accept = {
        $set: {
          role: "admin",
        },
      };

      const result = await userCollection.updateOne(filter, accept);

      res.send(result);
    });
    app.put("/teacher/accept/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { email: id };
      const update = req.body;
      const statusFilter = { teacherEmail: id };

      const accept = {
        $set: {
          role: "teacher",
        },
      };
      const statusSet = {
        $set: {
          status: update.status,
        },
      };

      const status = await teacherApplyCollection.updateOne(
        statusFilter,
        statusSet
      );
      if (update.status !== "reject") {
        const result = await userCollection.updateOne(filter, accept);
        console.log(update.status);
      }

      res.send(status);
    });

    // post class through teacher
    app.post("/class/add", async (req, res) => {
      const data = req.body;
      ("");
      const result = await classCollection.insertOne(data);

      res.send(result);
    });
    // get class with params for checking who the teacher is

    app.get("/class/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { email: id };
        const data = await classCollection.find(query);
        const result = await data.toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    // modify single class
    app.put("/class/modify/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const data = req.body;
      const update = {
        $set: {
          title: data.title,
          description: data.description,
          price: data.price,
          photo: data.photo,
        },
      };

      const result = await classCollection.updateOne(filter, update);

      res.send(result);
    });

    // api for delete class
    app.delete("/class/delete/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await classCollection.deleteOne(filter);
      res.send(result);
    });

    app.get("/admin/all/class", async (req, res) => {
      try {
        const filter = { status: { $in: ["pending", "approve"] } };
        const data = await classCollection.find(filter);
        const result = await data.toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    // admin class approve
    app.put("/admin/approve/:id", async (req, res) => {
      const id = req.params.id;

      const filter = { _id: new ObjectId(id) };
      const updateStatus = req.body;

      const statusSet = {
        $set: {
          status: updateStatus.status,
        },
      };
      const result = await classCollection.updateOne(filter, statusSet);
      res.send(result);
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
