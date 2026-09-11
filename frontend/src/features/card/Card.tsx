import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, Dropdown, Modal, Button } from '../../components/ui';
import { useBoard } from '../../hooks/useBoard';
import { formatRelativeTime, getInitials, classNames } from '../../utils';

interface CardProps {
  card: {
    id: string;
    title: string;
    description?: string;
    assignees: Array<{ id: string; name: string; email: string; avatar?: string }>;
    labels: string[];
    dueDate?: string;
    attachments: any[];
  };
  listId: string;
}

export function Card({ card, listId }: CardProps) {
  const { moveCard, updateCard, deleteCard, addAssignee, removeAssignee } = useBoard();
  const [showModal, setShowModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: card.id,
    data: { listId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardActions = [
    { label: 'Edit', onClick: () => setShowModal(true) },
    { label: 'Copy link', onClick: () => navigator.clipboard.writeText(window.location.href) },
    { label: 'Archive', onClick: () => updateCard(card.id, { isArchived: true }) },
    { label: 'Delete', onClick: () => deleteCard(card.id), danger: true },
  ];

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && !card.dueDate.includes('T00:00:00');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classNames(
        'card p-3 cursor-pointer hover:shadow-md transition-shadow',
        isDragging && 'ring-2 ring-primary-500'
      )}
      {...attributes}
      onClick={() => setShowModal(true)}
    >
      <div className="flex items-start gap-2">
        <div {...listeners} className="flex-shrink-0 w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
        <h4 className="flex-1 font-medium text-slate-900 dark:text-white text-sm leading-snug min-w-0">{card.title}</h4>
        <Dropdown
          trigger={
            <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          }
          items={cardActions}
          align="right"
        />
      </div>

      {card.description && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{card.description}</p>
      )}

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {card.labels.map((label, index) => (
          <span key={index} className="badge-primary text-xs">{label}</span>
        ))}

        {card.dueDate && (
          <span className={classNames(
            'badge text-xs flex items-center gap-1',
            isOverdue ? 'badge-danger' : 'badge-gray'
          )}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatRelativeTime(card.dueDate)}
          </span>
        )}

        {card.attachments.length > 0 && (
          <span className="badge-gray text-xs flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {card.attachments.length}
          </span>
        )}
      </div>

      {card.assignees.length > 0 && (
        <div className="mt-2 flex -space-x-2">
          {card.assignees.slice(0, 3).map((assignee, index) => (
            <Avatar
              key={assignee.id}
              name={assignee.name}
              src={assignee.avatar}
              size="xs"
              className={index > 0 ? '-ml-2' : ''}
            />
          ))}
          {card.assignees.length > 3 && (
            <Avatar name={`${card.assignees.length - 3}+`} size="xs" className="-ml-2 bg-slate-200 dark:bg-slate-700" />
)}
        </div>
      </div>
    </div>
  );
}