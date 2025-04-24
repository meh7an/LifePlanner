import Board from "../models/Board.js";

// CREATE a new board
export const createBoard = async (boardData) => {
  const board = new Board(boardData);
  return await board.save();
};

// READ: Get all boards for a specific user
export const getBoardsByUser = async (userId) => {
  return await Board.find({ userId });
};

// UPDATE a board by boardId
export const updateBoard = async (boardId, updateData) => {
  return await Board.findOneAndUpdate({ boardId }, updateData, { new: true });
};

// DELETE a board by boardId
export const deleteBoard = async (boardId) => {
  return await Board.findOneAndDelete({ boardId });
};
