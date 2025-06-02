import { Board, List, CreateBoardRequest, UpdateBoardRequest, CreateListRequest, UpdateListRequest, ApiError } from '@/lib/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import apiClient from '@/lib/api/client';
import toast from 'react-hot-toast';

interface BoardState {
    // Data
    boards: Board[];
    selectedBoard: Board | null;

    // Loading states
    loading: boolean;
    createLoading: boolean;
    updateLoading: boolean;
    deleteLoading: boolean;

    // Error states
    error: string | null;

    // Actions
    fetchBoards: (includeArchived?: boolean) => Promise<void>;
    fetchBoard: (id: string) => Promise<void>;
    createBoard: (data: CreateBoardRequest) => Promise<boolean>;
    updateBoard: (id: string, data: UpdateBoardRequest) => Promise<boolean>;
    deleteBoard: (id: string, permanent?: boolean) => Promise<boolean>;
    createList: (boardId: string, data: CreateListRequest) => Promise<boolean>;
    updateList: (id: string, data: UpdateListRequest) => Promise<boolean>;
    deleteList: (id: string) => Promise<boolean>;
    setSelectedBoard: (board: Board | null) => void;
    clearError: () => void;
}

export const useBoardStore = create<BoardState>()(
    devtools(
        immer((set) => ({
            // Initial state
            boards: [],
            selectedBoard: null,
            loading: false,
            createLoading: false,
            updateLoading: false,
            deleteLoading: false,
            error: null,

            fetchBoards: async (includeArchived = false) => {
                set((state) => { state.loading = true; state.error = null; });
                try {
                    const response = await apiClient.getBoards(includeArchived);
                    set((state) => {
                        state.boards = response.boards || [];
                        state.loading = false;
                    });
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.loading = false;
                        state.error = apiError.message;
                    });
                }
            },

            fetchBoard: async (id) => {
                try {
                    const response = await apiClient.getBoard(id);
                    set((state) => {
                        state.selectedBoard = response.data || null;
                    });
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.error = apiError.message;
                    });
                }
            },

            createBoard: async (data) => {
                set((state) => { state.createLoading = true; state.error = null; });
                try {
                    const response = await apiClient.createBoard(data);
                    if (response.boardID) {
                        set((state) => {
                            state.boards.unshift(response);
                            state.createLoading = false;
                        });
                        toast.success('Board created successfully! 📋');
                        return true;
                    }
                    return false;
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.createLoading = false;
                        state.error = apiError.message;
                    });
                    toast.error(apiError.message || 'Failed to create board!');
                    return false;
                }
            },

            updateBoard: async (id, data) => {
                set((state) => { state.updateLoading = true; state.error = null; });
                try {
                    const response = await apiClient.updateBoard(id, data);
                    if (response.data) {
                        set((state) => {
                            const index = state.boards.findIndex((b: Board) => b.boardID === id);
                            if (index !== -1 && response.data) {
                                state.boards[index] = response.data;
                            }
                            if (state.selectedBoard?.boardID === id) {
                                state.selectedBoard = response.data ?? null;
                            }
                            state.updateLoading = false;
                        });
                        toast.success('Board updated successfully! ✨');
                        return true;
                    }
                    return false;
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.updateLoading = false;
                        state.error = apiError.message;
                    });
                    toast.error(apiError.message || 'Failed to update board!');
                    return false;
                }
            },

            deleteBoard: async (id, permanent = false) => {
                set((state) => { state.deleteLoading = true; state.error = null; });
                try {
                    await apiClient.deleteBoard(id, permanent);
                    set((state) => {
                        if (permanent) {
                            state.boards = state.boards.filter((b: Board) => b.boardID !== id);
                        } else {
                            const index = state.boards.findIndex((b: Board) => b.boardID === id);
                            if (index !== -1) {
                                state.boards[index].isArchived = true;
                            }
                        }
                        if (state.selectedBoard?.boardID === id && permanent) {
                            state.selectedBoard = null;
                        }
                        state.deleteLoading = false;
                    });
                    toast.success(permanent ? 'Board deleted permanently! 🗑️' : 'Board archived! 📦');
                    return true;
                } catch (error) {
                    const apiError = error as ApiError;
                    set((state) => {
                        state.deleteLoading = false;
                        state.error = apiError.message;
                    });
                    toast.error(apiError.message || 'Failed to delete board!');
                    return false;
                }
            },

            createList: async (boardId, data) => {
                try {
                    const response = await apiClient.createList(boardId, data);
                    if (response) {
                        set((state) => {
                            // Add to selected board if it matches
                            if (state.selectedBoard?.boardID === boardId) {
                                if (!state.selectedBoard.lists) {
                                    state.selectedBoard.lists = [];
                                }
                                if (response) {
                                    state.selectedBoard.lists.push(response);
                                }
                            }

                            // Update board in boards array
                            const boardIndex = state.boards.findIndex((b: Board) => b.boardID === boardId);
                            if (boardIndex !== -1) {
                                if (!state.boards[boardIndex].lists) {
                                    state.boards[boardIndex].lists = [];
                                }
                                state.boards[boardIndex].lists!.push(response);
                            }
                        });
                        toast.success('List created successfully! 📝');
                        return true;
                    }
                    return false;
                } catch (error) {
                    const apiError = error as ApiError;
                    toast.error(apiError.message || 'Failed to create list!');
                    return false;
                }
            },

            updateList: async (id, data) => {
                try {
                    const response = await apiClient.updateList(id, data);
                    if (response) {
                        set((state) => {
                            // Update in selected board
                            if (state.selectedBoard?.lists) {
                                const listIndex = state.selectedBoard.lists.findIndex((l: List) => l.listID === id);
                                if (listIndex !== -1) {
                                    state.selectedBoard.lists[listIndex] = response;
                                }
                            }

                            // Update in boards array
                            state.boards.forEach((board: Board) => {
                                if (board.lists) {
                                    const listIndex: number = board.lists.findIndex((l: List) => l.listID === id);
                                    if (listIndex !== -1 && response) {
                                        board.lists[listIndex] = response;
                                    }
                                }
                            });
                        });
                        toast.success('List updated successfully! ✨');
                        return true;
                    }
                    return false;
                } catch (error) {
                    const apiError = error as ApiError;
                    toast.error(apiError.message || 'Failed to update list!');
                    return false;
                }
            },

            deleteList: async (id) => {
                try {
                    await apiClient.deleteList(id);
                    set((state) => {
                        // Remove from selected board
                        if (state.selectedBoard?.lists) {
                            state.selectedBoard.lists = state.selectedBoard.lists.filter((l: List) => l.listID !== id);
                        }

                        // Remove from boards array
                        state.boards.forEach((board: Board) => {
                            if (board.lists) {
                                board.lists = board.lists.filter((l: List) => l.listID !== id);
                            }
                        });
                    });
                    toast.success('List deleted successfully! 🗑️');
                    return true;
                } catch (error) {
                    const apiError = error as ApiError;
                    toast.error(apiError.message || 'Failed to delete list!');
                    return false;
                }
            },

            setSelectedBoard: (board) => set((state) => { state.selectedBoard = board; }),
            clearError: () => set((state) => { state.error = null; }),
        })),
        { name: 'BoardStore' }
    )
);