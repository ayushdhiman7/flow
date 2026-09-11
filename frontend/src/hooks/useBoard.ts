import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';
import { boardApi, listApi, cardApi } from '../api/endpoints';
import { useSocket } from './useSocket';
import { CARD_ACTIONS } from '../utils/constants';

export function useBoard() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { currentBoard, lists, isLoading, setBoard, setLists, addList, updateList, deleteList, reorderLists,
    addCard, updateCard, moveCard, deleteCard, addAssignee, removeAssignee, setLoading, clearBoard } = useBoardStore();
  const { user } = useAuthStore();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!boardId) return;
    const loadBoard = async () => {
      setLoading(true);
      try {
        const [boardRes, fullRes] = await Promise.all([
          boardApi.get(boardId),
          boardApi.getFull(boardId),
        ]);
        setBoard({ id: boardRes.data.board._id, name: boardRes.data.board.name, background: boardRes.data.board.background });
        setLists(fullRes.data.lists);
      } catch (err) {
        console.error('Failed to load board:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    loadBoard();
    return () => clearBoard();
  }, [boardId, setBoard, setLists, setLoading, clearBoard, navigate]);

  useEffect(() => {
    if (!socket || !isConnected || !boardId) return;

    const handleCardCreated = (data: { card: any }) => addCard(data.card.list, data.card);
    const handleCardMoved = (data: { card: any; fromList: string }) => moveCard(data.card._id, data.card.list, data.card.position);
    const handleCardUpdated = (data: { card: any }) => updateCard(data.card._id, data.card);
    const handleCardDeleted = (data: { cardId: string }) => deleteCard(data.cardId);
    const handleCardAssigned = (data: { card: any; assignees: string[] }) => {
      data.assignees.forEach(id => addAssignee(data.card._id, { id, name: '', email: '', avatar: '' }));
    };

    socket.on(CARD_ACTIONS.CREATED, handleCardCreated);
    socket.on(CARD_ACTIONS.MOVED, handleCardMoved);
    socket.on(CARD_ACTIONS.UPDATED, handleCardUpdated);
    socket.on(CARD_ACTIONS.DELETED, handleCardDeleted);
    socket.on(CARD_ACTIONS.ASSIGNED, handleCardAssigned);

    return () => {
      socket.off(CARD_ACTIONS.CREATED, handleCardCreated);
      socket.off(CARD_ACTIONS.MOVED, handleCardMoved);
      socket.off(CARD_ACTIONS.UPDATED, handleCardUpdated);
      socket.off(CARD_ACTIONS.DELETED, handleCardDeleted);
      socket.off(CARD_ACTIONS.ASSIGNED, handleCardAssigned);
    };
  }, [socket, isConnected, boardId, addCard, moveCard, updateCard, deleteCard, addAssignee]);

  const createList = useCallback(async (name: string) => {
    const res = await listApi.create(boardId!, { name });
    addList({ ...res.data.list, cards: [] });
    return res.data.list;
  }, [boardId, addList]);

  const updateListName = useCallback(async (id: string, name: string) => {
    await listApi.update(id, { name });
    updateList(id, { name });
  }, [updateList]);

  const createCard = useCallback(async (listId: string, title: string) => {
    const res = await cardApi.create(listId, { title });
    addCard(listId, { ...res.data.card, assignees: [], labels: [], attachments: [] });
    return res.data.card;
  }, [addCard]);

  const updateCardTitle = useCallback(async (cardId: string, title: string) => {
    await cardApi.update(cardId, { title });
    updateCard(cardId, { title });
  }, [updateCard]);

  const moveCardOptimistic = useCallback(async (cardId: string, newListId: string, newPosition: number) => {
    moveCard(cardId, newListId, newPosition);
    try {
      await cardApi.move(cardId, { listId: newListId, position: newPosition });
    } catch {
      // rollback handled by socket
    }
  }, [moveCard]);

  return {
    currentBoard,
    lists,
    isLoading,
    createList,
    updateListName,
    deleteList: async (id: string) => { await listApi.delete(id); deleteList(id); },
    reorderLists: async (listIds: string[]) => { await listApi.reorder(boardId!, listIds); reorderLists(listIds); },
    createCard,
    addCard: createCard,
    updateCardTitle,
    updateCard: async (cardId: string, data: any) => { await cardApi.update(cardId, data); updateCard(cardId, data); },
    moveCard: moveCardOptimistic,
    deleteCard: async (cardId: string) => { await cardApi.delete(cardId); deleteCard(cardId); },
    addAssignee: async (cardId: string, userId: string) => { await cardApi.addAssignees(cardId, [userId]); },
    removeAssignee: async (cardId: string, userId: string) => { await cardApi.removeAssignee(cardId, userId); removeAssignee(cardId, userId); },
  };
}