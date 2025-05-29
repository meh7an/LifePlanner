import mongoose from "mongoose";

const calendarEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  calendarId: { type: String, required: true }, // Link to Calendar

  title: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },

  eventType: {
    type: String,
    enum: ["task", "reminder", "custom"],
    default: "custom",
  },
  alarm: { type: Boolean, default: false },
  reminderTime: { type: Date },
  taskId: { type: String }, // Optional link to a Task
});

const CalendarEvent = mongoose.model("CalendarEvent", calendarEventSchema);
export default CalendarEvent;
