'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '../../components/ui/drawer';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { logEvent } from '../../lib/analytics';

export type ComposeDraft = {
  to: string[];
  subject: string;
  body: string;
};

export function ComposePanel({
  open,
  initial,
  draftKey,
  onClose,
  onSend,
  onAutoSave,
}: {
  open: boolean;
  initial?: Partial<ComposeDraft>;
  draftKey?: string;
  onClose: () => void;
  onSend: (data: ComposeDraft) => void;
  onAutoSave: (draftKey: string, data: ComposeDraft) => void;
}) {
  const [to, setTo] = useState<string[]>(initial?.to ?? []);
  const [inputTo, setInputTo] = useState('');
  const [subject, setSubject] = useState(initial?.subject ?? '');
  const [body, setBody] = useState(initial?.body ?? '');

  useEffect(() => {
    if (open) {
      // reset to initial when opened
      setTo(initial?.to ?? []);
      setSubject(initial?.subject ?? '');
      setBody(initial?.body ?? '');
      setInputTo('');
    }
  }, [open, initial?.to?.join(','), initial?.subject, initial?.body]);

  const sheetRef = useRef<HTMLDivElement | null>(null);

  function commitRecipient() {
    const v = inputTo.trim();
    if (!v) return;
    const parts = v.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length) setTo((prev) => Array.from(new Set([...prev, ...parts])));
    setInputTo('');
  }

  function removeRecipient(idx: number) {
    setTo((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleSend() {
    commitRecipient();
    const data: ComposeDraft = { to, subject: subject.trim(), body };
    onSend(data);
    onClose();
  }

  // Auto-save draft with debounce when fields change
  useEffect(() => {
    if (!open || !draftKey) return;
    const t = setTimeout(() => {
      // Ensure recipients typed are committed before save
      const v = inputTo.trim();
      if (v) {
        const parts = v.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
        if (parts.length) setTo((prev) => Array.from(new Set([...prev, ...parts])));
        setInputTo('');
      }
      const data: ComposeDraft = { to, subject: subject.trim(), body };
      onAutoSave(draftKey, data);
    }, 600);
    return () => clearTimeout(t);
  }, [to.join(','), subject, body, inputTo, open, draftKey]);

  if (!open) return null;
  
  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="h-[80vh]">
        <DrawerHeader className="border-b border-border">
          <DrawerTitle>New message</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">To</div>
            <div className="flex flex-wrap gap-2 rounded-md border p-2">
              {to.map((addr, i) => (
                <span 
                  key={addr + i} 
                  className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground text-xs px-2 py-1"
                >
                  <span>{addr}</span>
                  <button 
                    onClick={() => removeRecipient(i)} 
                    aria-label={`Remove ${addr}`} 
                    className="w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors text-[10px] flex items-center justify-center"
                  >
                    ✕
                  </button>
                </span>
              ))}
              <Input
                value={inputTo}
                onChange={(e) => setInputTo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
                    e.preventDefault();
                    commitRecipient();
                  } else if (e.key === 'Backspace' && !inputTo && to.length) {
                    setTo((prev) => prev.slice(0, -1));
                  }
                }}
                placeholder={to.length ? '' : 'name@bitmail.to, bob@...'}
                className="flex-1 h-8 border-0 bg-transparent px-0 focus:ring-0 focus:outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Subject</div>
            <Input 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="What's this about?" 
              className="h-9"
            />
          </div>

          <Textarea 
            value={body} 
            onChange={(e) => setBody(e.target.value)} 
            placeholder="Write your message..." 
            className="min-h-[240px]"
          />
        </div>

        <DrawerFooter className="mt-0 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground">Autosaving draft…</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={(e) => { logEvent('compose.cancel'); onClose(); }}>Cancel</Button>
            <Button onClick={(e) => { logEvent('compose.send', { to: to.length, subject: !!subject }); handleSend(); }}>Send</Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

//
