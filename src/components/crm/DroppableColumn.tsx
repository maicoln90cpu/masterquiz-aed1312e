import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const DroppableColumn = ({ id, children, className }: DroppableColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        'transition-all duration-200',
        isOver && 'ring-2 ring-primary ring-offset-2 scale-[1.02]',
        className
      )}
    >
      {children}
    </div>
  );
};
