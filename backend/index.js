"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const bullmq_1 = require("bullmq");
dotenv_1.default.config({ path: "./.env" });
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
const db = process.env.MONGO_URL;
const sendDataBase = new bullmq_1.Queue("codeshare.io/sendToDataBase", {
    connection: {
        host: "localhost",
        port: 6379,
    },
});
function connectToMongo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(db, {});
            console.log("Connected to MongoDB");
        }
        catch (error) {
            console.error("MongoDB connection error:", error.message);
            process.exit(1);
        }
    });
}
connectToMongo();
const PORT1 = process.env.PORT || 3000;
const RegisterSchema = new mongoose_1.default.Schema({
    PageId: {
        type: String,
        unique: true,
    },
    data: {
        type: String,
    },
});
const RegisterModel = mongoose_1.default.model("Reg", RegisterSchema);
function createData(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const userData = new RegisterModel({
            PageId: id,
            data: "",
        });
        yield userData.save();
    });
}
function updateData(id, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield RegisterModel.findOneAndUpdate({ PageId: id }, { $set: { data: info } }, { new: true });
        return res === null || res === void 0 ? void 0 : res.data;
    });
}
function getBackData(id) {
    return __awaiter(this, void 0, void 0, function* () {
        let existingData = yield RegisterModel.findOne({ PageId: id });
        if (!existingData) {
            yield createData(id);
            existingData = yield RegisterModel.findOne({ PageId: id });
        }
        return (existingData === null || existingData === void 0 ? void 0 : existingData.data) || "";
    });
}
const worker = new bullmq_1.Worker("codeshare.io/sendToDataBase", (job) => __awaiter(void 0, void 0, void 0, function* () {
    const data = job.data;
    const res = yield updateData(data.id, data.textabout);
    io.to(data.id).emit("data-from-server", res);
}), {
    connection: {
        host: "localhost",
        port: 6379,
    },
});
io.on("connection", (socket) => {
    console.log("New client connected");
    socket.on("join-room", (roomId) => __awaiter(void 0, void 0, void 0, function* () {
        socket.join(roomId);
        const res = yield getBackData(roomId);
        socket.emit("data-from-server", res);
    }));
    socket.on("send-data-from-client", (newData) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield sendDataBase.add("mongoDbAdd", newData, {
                removeOnComplete: true,
                removeOnFail: true,
            });
        }
        catch (error) {
            console.error("Error sending message to queue:", error);
        }
    }));
    socket.on("disconnect", () => {
        console.log("Client disconnected");
    });
});
server.listen(PORT1, () => {
    console.log(`Server is running on port ${PORT1}`);
});
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        worker;
    });
}
init();
