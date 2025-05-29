import mongoose from "mongoose";

const repeatSchema = new mongoose.Schema({
  repeatId: { type: String, required: true, unique: true },
  taskId: { type: String, required: true }, // link to Task

  periodType: {
    type: String,
    enum: ["daily", "weekly", "monthly"],
    required: true,
  },
  periodValue: { type: Number }, // e.g., every 2 days, 3 weeks...

  repeatDays: [{ type: String }], // ["Mon", "Wed", "Fri"] — for weekly
  endDate: { type: Date }, // optional
  isInfinite: { type: Boolean, default: false },
});

const Repeat = mongoose.model("Repeat", repeatSchema);
export default Repeat;
