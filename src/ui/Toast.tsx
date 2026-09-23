export interface ToastMessage {
  id: number;
  kind: 'ok' | 'error';
  text: string;
}

export function Toast({ message }: { message: ToastMessage | null }) {
  if (!message) return null;
  return (
    <div key={message.id} className={`toast toast-${message.kind}`} role="status" data-testid="toast">
      {message.text}
    </div>
  );
}
