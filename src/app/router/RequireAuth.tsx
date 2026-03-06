import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/app/store/hooks';
import { selectIsAuthed } from '@/entities/session/model/sessionSelectors';

export function RequireAuth({ children }: PropsWithChildren) {
  const isAuthed = useAppSelector(selectIsAuthed);
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}
