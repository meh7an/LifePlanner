const connectToDatabase = require("./db");

// Load models
require("./models/User");
require("./models/Board");
require("./models/Task");
require("./models/TaskStep");
require("./models/List");
require("./models/Calendar");
require("./models/CalendarEvent");
require("./models/Note");
require("./models/Post");
require("./models/Memory");
require("./models/Archive");
require("./models/Repeat");
require("./models/View");
require("./models/Share");
require("./models/Streak");
require("./models/FocusSession");

connectToDatabase().then(() => {
  console.log("📦 MongoDB connection test successful and User schema loaded");
  process.exit();
});
