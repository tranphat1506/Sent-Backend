const router = require("express").Router();
const { verifyTokenBySocketIO } = require("../../middlewares/auth.middleware");
const { countUser } = require("../../services/socket.io/common.service");
const {
  RoomEventBySocketIO,
  joinMessageRooms,
} = require("../../controllers/room.controller");
const { MessageEventBySocketIO } = require("../message.controller");

const messageNamespace = (namespace) => {
  // Authorization
  namespace.use((socket, next) => {
    verifyTokenBySocketIO(socket, next);
  });
  // Logic xử lý kết nối
  namespace.on("connection", async (socket) => {
    // Connect handle on namespace '/online'
    // .....
    // connnect Event
    await connectEvent(socket);

    // Handle room event
    RoomEventBySocketIO(socket);
    MessageEventBySocketIO(socket);

    // Disconnect handle on namespace '/online'
    socket.on("disconnect", () => {});
  });
  // Các tuyến đường khác cho namespace có thể được thêm ở đây

  return router;
};

const connectEvent = async (socket) => {
  const response = await joinMessageRooms(socket, socket.user._id);
  // join exist user room
  console.log(
    socket.user._id,
    "was join",
    (await response.joinPromises).length,
    "message rooms"
  );
  console.log(response.rooms);
  // sent rooms state for user
  const roomList = [];
};

module.exports = messageNamespace;
