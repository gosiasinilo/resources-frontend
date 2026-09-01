import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router';
import { getSkills, createSkill, deleteSkill } from '../services/skill-services';
import type { Skill } from '../services/types';
import { toast } from '../components/Toaster/Toaster';
import Button from '../components/Button/Button';
import Card from '../components/Card/Card';
import FieldError from '../components/FieldError/FieldError';
import SkillJobsModal from '../components/SkillJobsModal/SkillJobsModal';

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState(false);
  const [error, setError]       = useState('');
  const [modalSkill, setModalSkill] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    try { setSkills(await getSkills()); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) { setError('Please enter a skill name'); return; }
    setError('');
    setAdding(true);
    try {
      await createSkill(newSkill.trim());
      toast.success(`"${newSkill}" added`);
      setNewSkill('');
      await load();
    } catch (err: any) {
      setError(err.data?.details?.name?.[0] || err.message || 'Failed to add skill');
    }
    finally { setAdding(false); }
  };

  const handleDelete = async (skill: Skill) => {
    try { await deleteSkill(skill.id); toast.success(`"${skill.name}" removed`); await load(); }
    catch { /**/ }
  };

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <p className="text-inactive text-xs uppercase tracking-wider mb-1">Configuration</p>
        <h1 className="font-display text-3xl text-text flex items-center gap-3">
          <FontAwesomeIcon icon="screwdriver-wrench" className="text-highlight text-2xl" />Skills
        </h1>
      </div>

      <form onSubmit={handleAdd} className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FontAwesomeIcon icon="screwdriver-wrench" className="absolute left-3 top-1/2 -translate-y-1/2 text-inactive text-xs" />
            <input className="input pl-8" value={newSkill}
              onChange={e => { setNewSkill(e.target.value); setError(''); }} placeholder="e.g. Forklift" />
          </div>
          <Button type="submit" icon="plus" disabled={adding}>
            {adding ? '...' : 'Add'}
          </Button>
        </div>
        <FieldError message={error} />
      </form>

      {loading
        ? <p className="text-secondary text-sm animate-pulse">Loading...</p>
        : skills.length === 0
          ? <p className="text-inactive text-sm">No skills yet. Add one above.</p>
          : (
            <div className="space-y-1.5">
              {skills.map(s => (
                <Card key={s.id} className="flex items-center justify-between px-4 py-3 hover:border-secondary/40 transition-colors">
                  <button
                    onClick={() => setModalSkill(s.name)}
                    className="flex items-center gap-2.5 text-text text-sm hover:text-secondary transition-colors"
                  >
                    <FontAwesomeIcon icon="screwdriver-wrench" className="text-inactive text-xs" />{s.name}
                  </button>
                  <button onClick={() => handleDelete(s)}
                    className="text-inactive hover:text-orange-400 transition-colors text-xs flex items-center gap-1.5">
                    <FontAwesomeIcon icon="trash" />Remove
                  </button>
                </Card>
              ))}
            </div>
          )
      }

      {modalSkill && (
        <SkillJobsModal
          skillName={modalSkill}
          onClose={() => setModalSkill(null)}
          onJobClick={jobId => { setModalSkill(null); navigate(`/jobs?selected=${jobId}`); }}
        />
      )}
    </div>
  );
}
