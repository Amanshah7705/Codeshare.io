import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { Queue, Worker } from "bullmq";

dotenv.config({ path: "./.env" });

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const db = process.env.MONGO_URL || "";

const sendDataBase = new Queue("codeshare.io/sendToDataBase", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});

async function connectToMongo() {
  try {
    await mongoose.connect(db!, {
    
    });
    console.log("Connected to MongoDB");
  } catch (error: any) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
}

connectToMongo();

const PORT1 = process.env.PORT || 3000;

const RegisterSchema = new mongoose.Schema({
  PageId: {
    type: String,
    unique: true,
  },
  data: {
    type: String,
  },
});

const RegisterModel = mongoose.model("Reg", RegisterSchema);

async function createData(id: string) {
  const userData = new RegisterModel({
    PageId: id,
    data: "",
  });
  await userData.save();
}

async function updateData(id: string, info: string) {
  const res = await RegisterModel.findOneAndUpdate(
    { PageId: id },
    { $set: { data: info } },
    { new: true }
  );
  return res?.data;
}

async function getBackData(id: string) {
  let existingData = await RegisterModel.findOne({ PageId: id });
  if (!existingData) {
    await createData(id);
    existingData = await RegisterModel.findOne({ PageId: id });
  }
  return existingData?.data || "";
}

const worker = new Worker(
  "codeshare.io/sendToDataBase",
  async (job) => {
    const data = job.data;
    const res = await updateData(data.id, data.textabout);
    io.to(data.id).emit("data-from-server", res);
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("join-room", async (roomId) => {
    socket.join(roomId);
    const res = await getBackData(roomId);
    socket.emit("data-from-server", res);
  });

  socket.on("send-data-from-client", async (newData) => {
    try {
      await sendDataBase.add("mongoDbAdd", newData, {
        removeOnComplete: true,
        removeOnFail: true,
      });
    } catch (error) {
      console.error("Error sending message to queue:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT1, () => {
  console.log(`Server is running on port ${PORT1}`);
});

async function init() {
  worker;
}
init();
