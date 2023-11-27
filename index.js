const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const userCollection = client.db("blazeEdu").collection("users");
    const classCollection = client.db("blazeEdu").collection("class");
    const paymentCollection = client.db("blazeEdu").collection("payments");
    const studentAssignmentCollection = client
      .db("blazeEdu")
      .collection("studentAssignment");
    const teacherAssignmentCollection = client
      .db("blazeEdu")
      .collection("assignments");
    const studentEnrollmentCollection = client
      .db("blazeEdu")
      .collection("studentEnrolment");
    const teacherApplyCollection = client
      .db("blazeEdu")
      .collection("teacherApply");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

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
    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const data = await userCollection.find();
        const result = await data.toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });
    // teacher request
    app.get("/teacher/request", verifyToken, verifyAdmin, async (req, res) => {
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
    // get class with params for checking the specific teacher

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
    // get the filter approve classes
    app.get("/class/filter/approve", async (req, res) => {
      try {
        const filter = { status: "approve" };
        const data = await classCollection.find(filter);
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

    // get a single class for student
    app.get("/student/class/single/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await classCollection.findOne(query);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.post("/student/enrollment", verifyToken, async (req, res) => {
      const data = req.body;
      const filter = {
        class_id: data.class_id,
        student_email: data.student_email,
      };

      const exist = await studentEnrollmentCollection.findOne(filter);

      if (exist) {
        res.send({ message: "Already Enrolled" });
      } else {
        const result = await studentEnrollmentCollection.insertOne(data);
        const count = {
          class_id: data.class_id,
        };

        const enrollCount = await studentEnrollmentCollection.countDocuments(
          count
        );
        const id = {
          _id: new ObjectId(data.class_id),
        };
        const setDecument = await classCollection.updateOne(id, {
          $set: {
            enrollCount: enrollCount,
          },
        });
        res.send(result);
      }
    });
    app.get("/student/enrollment/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { student_email: email };
      const data = await studentEnrollmentCollection.find(query);
      const result = await data.toArray();
      res.send(result);
    });

    app.get(
      "/teacher/single/class/details/:id",
      verifyToken,
      async (req, res) => {
        try {
          const id = req.params.id;
          const query = { _id: new ObjectId(id), status: "approve" };
          const result = await classCollection.findOne(query);
          res.send(result);
        } catch (err) {
          console.log(err);
        }
      }
    );

    app.post("/teacher/assignment", verifyToken, async (req, res) => {
      const data = req.body;
      const result = await teacherAssignmentCollection.insertOne(data);
      res.send(result);
    });
    app.get("/student/assignment/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { class_id: id };
      const data = await teacherAssignmentCollection.find(query);
      const result = await data.toArray();
      res.send(result);
    });

    app.post("/student/assignment/submit", verifyToken, async (req, res) => {
      const data = req.body;
      const filter = {
        class_id: data.class_id,
        student_email: data.student_email,
        assignment_id: data.assignment_id,
      };
      const isExist = await studentAssignmentCollection.findOne(filter);
      if (isExist) {
        res.send({ message: "Already Submit" });
      } else {
        const result = await studentAssignmentCollection.insertOne(data);
        res.send(result);
      }
    });
    app.get("/teacher/assignment/result/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { class_id: id };
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const filterStudent = {
        submission_date: {
          $gte: today.toLocaleDateString("en-US"),
          $lt: tomorrow.toLocaleDateString("en-US"),
        },
      };
      const studentAssignment =
        await studentAssignmentCollection.countDocuments(filterStudent);
      const totalAssignment = await teacherAssignmentCollection.find(filter);
      const result = await totalAssignment.toArray();
      res.send({ studentAssignment, result });
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
