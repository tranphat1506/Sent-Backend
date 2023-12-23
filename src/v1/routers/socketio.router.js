const express = require("express");
const router = express.Router();
const { socketCorsOptions } = require("../configs/cors.config");
const io = require("socket.io")(_SERVER, { cors: socketCorsOptions });
global._IO = io;
const messageNamespace = require("../controllers/socket.io/message.namespace");
const mainNamespace = require("../controllers/socket.io/online.namespace");

export const ENDPOINTS = {
  online: "/online",
  message: "/message",
};

const NAMESPACE_CONTROLLERS = {
  online: mainNamespace,
  message: messageNamespace,
};

Object.keys(ENDPOINTS).map((e) => {
  const endpoint = ENDPOINTS[e];
  const controller = NAMESPACE_CONTROLLERS[e];

  if (!endpoint || !controller) return false;
  try {
    router.use(endpoint, controller(io.of(endpoint)));
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
});

module.exports = router;
