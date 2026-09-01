import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createJob } from '../services/job-services';
import { getSkills } from '../services/skill-services';
import { useNavigate } from 'react-router';
import { toast } from '../components/Toaster/Toaster';
import Button from '../components/Button/Button';
import FieldError from '../components/FieldError/FieldError';
import Paper from '../components/Paper';
import type { JobType, Skill } from '../services/types';

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

export default function AddJobPage() {
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [jobType, setJobType]         = useState<JobType>('ONLINE');
  const [city, setCity]               = useState('');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [skills, setSkills]           = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => { getSkills().then(setSkills).catch(() => {}); }, []);

  const toggleSkill = (id: number) =>
    setSelectedSkills(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  const today = new Date().toISOString().split('T')[0];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    else if (name.trim().length < 4) e.name = 'At least 4 characters';
    if (!startDate) e.startDate = 'Required';
    else if (startDate < today) e.startDate = 'Start date cannot be in the past';
    if (!endDate) e.endDate = 'Required';
    if (startDate && endDate && endDate <= startDate) e.endDate = 'Must be after start date';
    if (jobType === 'LOCATION' && !city.trim()) e.city = 'City is required for location jobs';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await createJob({
        name, description: description || undefined, jobType, startDate, endDate,
        city: jobType === 'LOCATION' ? city : undefined,
        requiredSkillIds: selectedSkills.length ? selectedSkills : undefined,
      });
      toast.success(`Job "${name}" created`);
      navigate('/jobs');
    } catch (err: any) {
      if (err.data?.details) {
        const e: Record<string, string> = {};
        Object.entries(err.data.details).forEach(([k, v]) => { e[k] = Array.isArray(v) ? v[0] : String(v); });
        setErrors(e);
      } else {
        setErrors({ form: err.message || 'Failed to create job' });
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <p className="text-inactive text-xs uppercase tracking-wider mb-1">New</p>
        <h1 className="font-display text-3xl text-text flex items-center gap-3">
          <FontAwesomeIcon icon="briefcase" className="text-highlight text-2xl" />Add Job
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
        <Field label="Job Name" error={errors.name}>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Warehouse shift" />
        </Field>

        <Field label="Description">
          <textarea className="input resize-none" rows={2} value={description}
            onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
        </Field>

        <Field label="Job Type">
          <div className="flex gap-2">
            {(['ONLINE', 'LOCATION'] as JobType[]).map(t => (
              <button key={t} type="button" onClick={() => setJobType(t)}
                className={`flex-1 py-2.5 rounded-sm border text-sm flex items-center justify-center gap-2 transition-colors ${
                  jobType === t ? 'bg-toplayer border-toplayer text-text font-medium' : 'border-border text-inactive hover:border-secondary hover:text-secondary'
                }`}>
                <FontAwesomeIcon icon={t === 'ONLINE' ? 'globe' : 'location-dot'} />{t}
              </button>
            ))}
          </div>
        </Field>

        {jobType === 'LOCATION' && (
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
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date" error={errors.startDate}>
            <input type="date" className="input" min={today} value={startDate} onChange={e => setStartDate(e.target.value)} />
          </Field>
          <Field label="End Date" error={errors.endDate}>
            <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </Field>
        </div>

        {skills.length > 0 && (
          <Field label="Required Skills">
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
          </Field>
        )}

        <Button type="submit" icon="plus" fullWidth disabled={loading} className="py-3 mt-2">
          {loading ? 'Creating...' : 'Create Job'}
        </Button>
      </form>
    </div>
  );
}
