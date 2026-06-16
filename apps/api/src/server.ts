import http from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { attachRealtime } from "./socket";

const server = http.createServer(createApp());
attachRealtime(server);

server.listen(env.PORT, () => {
  console.log(`Rogjar API running on http://localhost:${env.PORT}`);
});
