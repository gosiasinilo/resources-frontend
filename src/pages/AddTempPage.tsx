import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createTemp } from '../services/temp-services';
import { getSkills } from '../services/skill-services';
import { useNavigate } from 'react-router';
import { toast } from '../components/Toaster/Toaster';
import Button from '../components/Button/Button';
import FieldError from '../components/FieldError/FieldError';
import Paper from '../components/Paper';
import type { Skill } from '../services/types';

function Field({ label, children, hint, error }: { label: string; children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <div>
      <label className="block text-xs text-inactive uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      <FieldError message={error} />
      {!error && hint && <p className="text-xs text-inactive mt-1">{hint}</p>}
    </div>
  );
}

export default function AddTempPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [city, setCity]           = useState('');
  const [notes, setNotes]         = useState('');
  const [skills, setSkills]       = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => { getSkills().then(setSkills).catch(() => {}); }, []);

  const toggleSkill = (id: number) =>
    setSelectedSkills(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    else if (firstName.trim().length < 3) e.firstName = 'At least 3 characters';
    if (!lastName.trim()) e.lastName = 'Last name is required';
    else if (lastName.trim().length < 3) e.lastName = 'At least 3 characters';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email';
    if (!city.trim()) e.city = 'City is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await createTemp({ firstName, lastName, email, city, notes: notes || undefined, skillIds: selectedSkills.length ? selectedSkills : undefined });
      toast.success(`${firstName} ${lastName} added`);
      navigate('/temps');
    } catch (err: any) {
      if (err.data?.details) {
        const e: Record<string, string> = {};
        Object.entries(err.data.details).forEach(([k, v]) => { e[k] = Array.isArray(v) ? v[0] : String(v); });
        setErrors(e);
      } else {
        setErrors({ form: err.message || 'Failed to create temp' });
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <p className="text-inactive text-xs uppercase tracking-wider mb-1">New</p>
        <h1 className="font-display text-3xl text-text flex items-center gap-3">
          <FontAwesomeIcon icon="user-group" className="text-highlight text-2xl" />Add Temp
        </h1>
      </div>

      {errors.form && (
        <Paper padded className="mb-4 border-orange-900/40">
          <p className="text-orange-400 text-sm flex items-center gap-2">
            <FontAwesomeIcon icon="xmark" />{errors.form}
          </p>
        </Paper>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" error={errors.firstName}>
            <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Alice" />
          </Field>
          <Field label="Last Name" error={errors.lastName}>
            <input className="input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" />
          </Field>
        </div>

        <Field label="Email" error={errors.email}>
          <div className="relative">
            <FontAwesomeIcon icon="user" className="absolute left-3 top-1/2 -translate-y-1/2 text-inactive text-xs" />
            <input type="email" className="input pl-8" value={email} onChange={e => setEmail(e.target.value)} placeholder="alice@example.com" />
          </div>
        </Field>

        <Field label="City" error={errors.city}>
          <div className="relative">
            <FontAwesomeIcon icon="location-dot" className="absolute left-3 top-1/2 -translate-y-1/2 text-inactive text-xs pointer-events-none" />
            <select className="input pl-8 appearance-none" value={city} onChange={e => setCity(e.target.value)}>
              <option value="">Select a city...</option>
              {['Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Hobart', 'Darwin'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </Field>

        {skills.length > 0 && (
          <Field label="Skills">
            <div className="flex flex-wrap gap-1.5">
              {skills.map(s => (
                <button key={s.id} type="button" onClick={() => toggleSkill(s.id)}
                  className={`px-3 py-1.5 rounded-full border text-xs transition-colors flex items-center gap-1.5 ${
                    selectedSkills.includes(s.id) ? 'bg-toplayer border-toplayer text-text' : 'border-border text-inactive hover:border-secondary hover:text-secondary'
                  }`}>
                  <FontAwesomeIcon icon="screwdriver-wrench" className="text-xs" />{s.name}
                </button>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <p className="text-xs text-inactive mt-1.5">{selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected</p>
            )}
          </Field>
        )}

        <Field label="Notes">
          <textarea className="input resize-none" rows={3} value={notes}
            onChange={e => setNotes(e.target.value)} placeholder="Any additional notes about this temp..." />
        </Field>

        <Button type="submit" icon="user-plus" fullWidth disabled={loading} className="py-3 mt-2">
          {loading ? 'Adding...' : 'Add Temp'}
        </Button>
      </form>
    </div>
  );
}
