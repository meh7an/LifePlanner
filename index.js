import connectToDatabase from "./db.js";

import "./models/User.js";
import "./models/Board.js";
import "./models/Task.js";
import "./models/TaskStep.js";
import "./models/List.js";
import "./models/Calendar.js";
import "./models/CalendarEvent.js";
import "./models/Note.js";
import "./models/Post.js";
import "./models/Memory.js";
import "./models/Archive.js";
import "./models/Repeat.js";
import "./models/View.js";
import "./models/Share.js";
import "./models/Streak.js";
import "./models/FocusSession.js";

connectToDatabase().then(() => {
  console.log("📦 MongoDB connection test successful and all schemas loaded");
  process.exit();
});
