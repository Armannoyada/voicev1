#!/usr/bin/env node
// Starts a localtunnel for the given port and writes the public URL to a file,
// avoiding node stdout buffering when launched detached from a TTY.
//
// Usage: node start-localtunnel.js <port> <url-file>

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

let localtunnel;
try {
  localtunnel = require("localtunnel");
} catch {
  const globalRoot = execSync("npm root -g").toString().trim();
  localtunnel = require(path.join(globalRoot, "localtunnel"));
}

const port = parseInt(process.argv[2] || "4000", 10);
const urlFile = process.argv[3] || ".lt.url";

(async () => {
  try {
    const tunnel = await localtunnel({ port });
    fs.writeFileSync(urlFile, tunnel.url + "\n");
    console.log("tunnel up:", tunnel.url);

    tunnel.on("close", () => {
      try { fs.unlinkSync(urlFile); } catch {}
      process.exit(0);
    });
    tunnel.on("error", (err) => {
      console.error("tunnel error:", err.message);
      process.exit(1);
    });

    const shutdown = () => {
      try { tunnel.close(); } catch {}
      try { fs.unlinkSync(urlFile); } catch {}
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    console.error("failed to start tunnel:", err.message);
    process.exit(1);
  }
})();
