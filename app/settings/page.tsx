// app/settings/page.tsx
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState<string>(user?.name ?? '');
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      // placeholder: wire to your user profile API if available
      await new Promise((r) => setTimeout(r, 500));
      setMsg('Profile updated.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <Card className="max-w-xl">
        <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Display name</label>
              <Input value={name} onChange={(e) => setName(e.currentTarget.value)} />
            </div>
            {msg && <div className="text-sm text-green-600">{msg}</div>}
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}