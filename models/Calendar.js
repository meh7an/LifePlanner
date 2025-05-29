import mongoose from "mongoose";

const calendarSchema = new mongoose.Schema({
  calendarId: { type: String, required: true, unique: true },
  userId: { type: String, required: true }, // owner

  name: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
});

const Calendar = mongoose.model("Calendar", calendarSchema);
export default Calendar;
