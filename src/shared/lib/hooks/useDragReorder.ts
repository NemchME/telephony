import { useRef, useCallback, useState } from 'react';

export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const onDragStart = useCallback(
    (index: number) => (e: React.DragEvent) => {
      dragIndexRef.current = index;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    },
    [],
  );

  const onDragOver = useCallback(
    (index: number) => (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    },
    [],
  );

  const onDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const onDrop = useCallback(
    (index: number) => (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverIndex(null);
      if (dragIndexRef.current !== null && dragIndexRef.current !== index) {
        onReorder(dragIndexRef.current, index);
      }
      dragIndexRef.current = null;
    },
    [onReorder],
  );

  const onDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }, []);

  return { onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, dragOverIndex };
}
