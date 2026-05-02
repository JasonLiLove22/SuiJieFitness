import Modal from './Modal';
import Button from './Button';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  destructive?: boolean;
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = '确认', destructive }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-gray-500 mb-6">{message}</p>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>取消</Button>
        <Button variant={destructive ? 'danger' : 'primary'} className="flex-1" onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
      </div>
    </Modal>
  );
}
