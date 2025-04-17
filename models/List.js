const mongoose = require("mongoose");

const listSchema = new mongoose.Schema({
  listId: { type: String, required: true, unique: true },
  boardId: { type: String, required: true }, // link to Board

  name: { type: String, required: true },
  order: { type: Number, default: 0 }, // to define position inside board
});

module.exports = mongoose.model("List", listSchema);
