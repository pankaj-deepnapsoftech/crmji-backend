const jwt = require("jsonwebtoken");
const adminModel = require("../models/admin");
const index = require("../index");
const { TryCatch } = require("./error");

const socketAuthenticator = TryCatch(async (err, socket, next) => {
  try {
    if (err) {
      return next(err);
    }

    access_token = socket.request.cookies?.access_token;
    if(!access_token){
      access_token = socket.request.headers?.authorization?.split(" ")[1];
    }
    const verified = jwt.verify(access_token, process.env.JWT_SECRET);
    const currTimeInMilliSeconds = Math.floor(Date.now() / 1000);

    // access_token is not expired
    if (
      verified &&
      verified.iat < currTimeInMilliSeconds &&
      verified.exp > currTimeInMilliSeconds
    ) {
      const user = await adminModel.findById(verified._id);
      if (!user) {
        throw new Error("User doesn't exists");
      }

      socket.user = {
        id: verified._id,
        email: verified.email,
        name: verified.name,
        organization: user.organization,
      };
      next();
    } else {
      throw new Error("Session expired!");
    }
  } catch (err) {
    throw new Error(err.message, 401);
  }
});

const getSockets = async (users = []) => {
  const sockets = await Promise.all(
    users.map(async (user) => {
      const socketId = index?.emailToSocketId?.get(user?.email);
      return socketId !== undefined ? socketId : null;
    })
  );
  return sockets.filter(socket => socket !== null);
};

const emitEvent = async (req, event, users, data) => {
  const io = req.app.get("io");
  const usersSocket = await getSockets(users);
  if(usersSocket.length > 0){
    io.to(usersSocket).emit(event, data);
  }
};

module.exports = {
  socketAuthenticator,
  emitEvent
};
