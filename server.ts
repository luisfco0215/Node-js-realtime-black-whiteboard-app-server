import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

interface User {
    id: string;
    name: string;
    room: string;
}

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});

const users: User[] = [];

io.on("connection", (socket: Socket) => {
    console.log("🔌 Cliente conectado:", socket.id);

    socket.on("join-room", ({ name, room }: { name: string; room: string }) => {
        socket.join(room);
        users.push({ id: socket.id, name, room });
        console.log(`${name} se unió a ${room}`);

        const roomUsers = users.filter((u) => u.room === room);
        io.to(room).emit("room-users", roomUsers);
    });

    socket.on("draw", (data: any & { room: string }) => {
        socket.to(data.room).emit("draw", data);
    });

    socket.on("disconnect", () => {
        const user = users.find((u) => u.id === socket.id);
        if (user) {
            const room = user.room;
            users.splice(users.indexOf(user), 1);
            io.to(room).emit(
                "room-users",
                users.filter((u) => u.room === room)
            );
            console.log(`❌ ${user.name} desconectado de ${room}`);
        }
    });
});

httpServer.listen(4000, () => console.log("🚀 Servidor corriendo en http://localhost:4000"));
