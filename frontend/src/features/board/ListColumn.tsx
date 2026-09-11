import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Input, Modal, Dropdown } from '../../components/ui';
import { Card } from '../card/Card';
import { useBoard } from '../../hooks/useBoard';
import { classNames } from '../../utils';

interface ListColumnProps {
  list: { id: string; name: string; position: number; cards: any[]; isArchived: boolean };
  isDragging: boolean;
}

export function ListColumn({ list, isDragging }: ListColumnProps) {
  const { addCard, deleteList, updateListName } = useBoard();
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showEditList, setShowEditList] = useState(false);
  const [editListName, setEditListName] = useState(list.name);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    await addCard(list.id, newCardTitle.trim());
    setShowCreateCard(false);
    setNewCardTitle('');
  };

  const handleUpdateListName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editListName.trim()) return;
    await updateListName(list.id, editListName.trim());
    setShowEditList(false);
  };

  const listActions = [
    { label: 'Rename', onClick: () => { setEditListName(list.name); setShowEditList(true); } },
    { label: 'Archive', onClick: () => {}, disabled: true },
    { label: 'Delete', onClick: () => deleteList(list.id), danger: true },
  ];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classNames(
        'w-64 flex-shrink-0 flex flex-col bg-slate-100 dark:bg-slate-800 rounded-xl h-fit max-h-full',
        isDragging ? 'opacity-50' : ''
      )}
      {...attributes}
    >
      <div className="p-3 border-b dark:border-slate-700 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white truncate">{list.name}</h3>
        <Dropdown
          trigger={
            <button
              {...listeners}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="List options"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          }
          items={listActions}
          align="right"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]" role="list" aria-label={`${list.name} cards`}>
        {list.cards.map((card) => (
          <Card key={card.id} card={card} listId={list.id} />
        ))}
      </div>

      <button
        onClick={() => setShowCreateCard(true)}
        className="mx-2 mb-2 px-3 py-2 text-left text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors w-full"
      >
        <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add a card
      </button>

      <Modal isOpen={showCreateCard} onClose={() => setShowCreateCard(false)} title="Add Card" size="sm">
        <form onSubmit={handleCreateCard} className="space-y-4">
          <Input
            label="Title"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" type="button" onClick={() => setShowCreateCard(false)}>Cancel</Button>
            <Button type="submit">Add Card</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditList} onClose={() => setShowEditList(false)} title="Rename List" size="sm">
        <form onSubmit={handleUpdateListName} className="space-y-4">
          <Input
            label="List name"
            value={editListName}
            onChange={(e) => setEditListName(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" type="button" onClick={() => setShowEditList(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
