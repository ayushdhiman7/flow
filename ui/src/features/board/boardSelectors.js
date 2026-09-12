export const selectBoards = s => s.board.boards;
export const selectCurrentBoardId = s => s.board.currentBoardId;
export const selectCurrentBoard = s => s.board.currentBoard;
export const selectLists = s => s.board.lists;
export const selectBoardLoading = s => s.board.loading;
export const selectBoardError = s => s.board.error;
export const selectBoardInitialized = s => s.board.initialized;

export const selectTaskStats = s => {
  const lists = s.board.lists;
  let total = 0;
  const byList = {};
  for (const l of lists) {
    byList[l.name] = (l.cards?.length || 0);
    total += l.cards?.length || 0;
  }
  return { total, byList };
};
