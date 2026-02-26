import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const isEmailUser = user?.app_metadata?.provider === 'email';

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('user_id', user.id);
    setSaving(false);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Saved', description: 'Profile updated.' });
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Done', description: 'Password updated.' }); setNewPassword(''); }
  };

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="mx-auto max-w-md p-4 space-y-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="font-display text-2xl font-bold text-foreground">Profile</h1>

        <div className="glass rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <p className="text-sm text-foreground/70">{user?.email}</p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl bg-muted py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl bg-muted py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
            {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Save Changes'}
          </button>
        </div>

        {isEmailUser && (
          <div className="glass rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Change Password</h2>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl bg-muted py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button onClick={handleChangePassword} disabled={changingPw} className="w-full rounded-xl border border-border bg-muted py-2.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50">
              {changingPw ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Update Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
