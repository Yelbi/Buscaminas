import { useEffect } from 'react';

export function Toast({ message, onDismiss, timeout = 3200 }: { message: string; onDismiss: () => void; timeout?: number }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, timeout);
    return () => clearTimeout(id);
  }, [message, onDismiss, timeout]);
  return <div className="toast" role="status">{message}</div>;
}
