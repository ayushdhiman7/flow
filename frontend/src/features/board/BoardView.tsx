import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button, Input, Modal } from '../../components/ui';
import { ListColumn } from './ListColumn';
import { useBoard } from '../../hooks/useBoard';
import { classNames } from '../../utils';

export function BoardView() {
  const { currentBoard, lists, isLoading, createList, reorderLists } = useBoard();
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: any) => {
    setDraggingId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setDraggingId(null);
    if (over && active.id !== over.id) {
      const oldIndex = lists.findIndex(l => l.id === active.id);
      const newIndex = lists.findIndex(l => l.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const newLists = arrayMove(lists, oldIndex, newIndex);
      const listIds = newLists.map(l => l.id);
      await reorderLists(listIds);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    await createList(newListName.trim());
    setShowCreateList(false);
    setNewListName('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{currentBoard?.name || 'Board'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowCreateList(true)}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add List
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={lists.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="flex-1 flex overflow-x-auto pb-4 gap-4 px-4" role="list" aria-label="Board lists">
            {lists.map((list) => (
              <ListColumn key={list.id} list={list} isDragging={draggingId === list.id} />
            ))}

            <button
              onClick={() => setShowCreateList(true)}
              className={classNames(
                'w-64 flex-shrink-0 flex items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed',
                'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
              )}
              aria-label="Add new list"
            >
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-slate-500 dark:text-slate-400">Add another list</span>
            </button>
          </div>
        </SortableContext>
      </DndContext>

      <Modal isOpen={showCreateList} onClose={() => setShowCreateList(false)} title="Add List" size="sm">
        <form onSubmit={handleCreateList} className="space-y-4">
          <Input
            label="List name"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="To Do"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" type="button" onClick={() => setShowCreateList(false)}>Cancel</Button>
            <Button type="submit">Add List</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
