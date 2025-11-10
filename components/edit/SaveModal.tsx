"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface SaveModalProps {
  isOpen: boolean;
  payload: Record<string, unknown>;
  onClose: () => void;
}

export function SaveModal({ isOpen, payload, onClose }: SaveModalProps) {
  return (
    <Modal
      title="Kaydedilecek Veriler"
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose}>
          Kapat
        </Button>
      }
    >
      <pre className="whitespace-pre-wrap break-all rounded-2xl bg-slate-900/95 p-5 text-xs text-slate-100 shadow-inner shadow-slate-950/50">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </Modal>
  );
}

