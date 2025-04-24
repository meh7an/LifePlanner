import Note from "../models/Note.js";

// CREATE a new note
export const createNote = async (noteData) => {
  const note = new Note(noteData);
  return await note.save();
};

// READ: Get all notes linked to a specific task
export const getNotesByTask = async (taskId) => {
  return await Note.find({ taskId });
};

// UPDATE a note by noteId
export const updateNote = async (noteId, updateData) => {
  return await Note.findOneAndUpdate({ noteId }, updateData, { new: true });
};

// DELETE a note by noteId
export const deleteNote = async (noteId) => {
  return await Note.findOneAndDelete({ noteId });
};
