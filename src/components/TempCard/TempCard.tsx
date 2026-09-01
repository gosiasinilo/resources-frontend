import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { deleteTemp, editTemp } from '../../services/temp-services';
import { getSkills } from '../../services/skill-services';
import type { Temp, TempDetail, Skill } from '../../services/types';
import { formatDate } from '../../pages/utils/date';
import Button from '../Button/Button';
import FieldError from '../FieldError/FieldError';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import SkillJobsModal from '../SkillJobsModal/SkillJobsModal';

function RatingBar({ value }: { value?: number | null }) {
  if (!value) return <span className="text-inactive text-xs">No rating yet</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 bg-bg rounded-full overflow-hidden">
        <div className="h-full bg-important rounded-full" style={{ width: `${(Number(value) / 5) * 100}%` }} />
      </div>
      <span className="text-important text-xs">{Number(value).toFixed(1)}</span>
    </div>
  );
}

export function initials(f: string, l: string) { return `${f[0]}${l[0]}`.toUpperCase(); }

const STATUS_COLOR: Record<string, string> = {
  INITIATED: 'text-important',
  ASSIGNED:  'text-highlight/60',
  ACTIVE:    'text-highlight',
  COMPLETED: 'text-secondary',
};

interface TempCardProps {
  temp: Temp;
  detail: TempDetail | null;
  isSelected: boolean;
  onSelect: () => void;
  onRefresh: () => void;
  onSuccess: (title: string, message: string) => void;
}

export default function TempCard({ temp, detail, isSelected, onSelect, onRefresh, onSuccess }: TempCardProps) {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm]     = useState(false);
  const [skillModal, setSkillModal]       = useState<string | null>(null);

  const doDelete = async () => {
    setShowConfirm(false);
    try {
      await deleteTemp(temp.id);
      onRefresh();
      onSuccess('Temp deleted', `${temp.firstName} ${temp.lastName} has been removed.`);
    } catch { /**/ }
  };

  return (
    <>
      {showConfirm && (
        <ConfirmModal
          message={`Delete ${temp.firstName} ${temp.lastName}?`}
          subMessage="Temp will be unassigned from all jobs."
          confirmLabel="Delete temp"
          onConfirm={doDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {skillModal && (
        <SkillJobsModal
          skillName={skillModal}
          onClose={() => setSkillModal(null)}
          onJobClick={jobId => navigate(`/jobs?selected=${jobId}`)}
        />
      )}

      {/* List item */}
      <div
        onClick={onSelect}
        className={`flex items-center gap-3 px-4 py-3 rounded border cursor-pointer transition-all ${
          isSelected
            ? 'bg-toplayer/20 border-highlight/40'
            : 'bg-paper border-border hover:border-secondary/40 hover:bg-paper/80'
        }`}
      >
        <div className="w-9 h-9 rounded-full bg-toplayer flex items-center justify-center text-text text-xs font-medium shrink-0">
          {initials(temp.firstName, temp.lastName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-text font-medium text-sm truncate">{temp.firstName} {temp.lastName}</p>
          <div className="flex items-center gap-2 text-inactive text-xs mt-0.5">
            <span className="flex items-center gap-1">
              <FontAwesomeIcon icon="location-dot" className="text-xs" />{temp.city}
            </span>
            {temp.rating
              ? <span className="text-important">★ {Number(temp.rating).toFixed(1)}</span>
              : <span className="text-border">★ –</span>
            }
          </div>
        </div>
        <FontAwesomeIcon
          icon={isSelected ? 'chevron-up' : 'chevron-down'}
          className="text-inactive text-xs shrink-0 ml-1 hidden sm:block"
        />
      </div>

      {isSelected && detail && (
        <div className="lg:hidden bg-paper border border-border rounded mt-1 overflow-hidden">
          <TempDetailContent
            detail={detail}
            onAssignJob={() => navigate(`/temps/${temp.id}/assign`)}
            onDelete={() => setShowConfirm(true)}
            onSkillClick={setSkillModal}
            onJobClick={jobId => navigate(`/jobs?selected=${jobId}`)}
            onRefresh={onRefresh}
            onSuccess={onSuccess}
          />
        </div>
      )}
    </>
  );
}

interface TempDetailContentProps {
  onRefresh: () => void;
  onSuccess: (title: string, message: string) => void;
  detail: TempDetail;
  onAssignJob: () => void;
  onDelete: () => void;
  onSkillClick: (skill: string) => void;
  onJobClick: (jobId: number) => void;
}

export function TempDetailContent({ detail, onAssignJob, onDelete, onSkillClick, onJobClick, onRefresh, onSuccess }: TempDetailContentProps) {
  const [panel, setPanel]             = useState<'view' | 'edit'>('view');
  const [editFirst, setEditFirst]     = useState(detail.firstName);
  const [editLast, setEditLast]       = useState(detail.lastName);
  const [editEmail, setEditEmail]     = useState(detail.email);
  const [editCity, setEditCity]       = useState(detail.city);
  const [editNotes, setEditNotes]     = useState(detail.notes || '');
  const [editSkillIds, setEditSkillIds] = useState<number[]>([]);
  const [allSkills, setAllSkills]     = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [editErrors, setEditErrors]   = useState<Record<string, string>>({});
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState('');

  const openEdit = async () => {
    setEditFirst(detail.firstName);
    setEditLast(detail.lastName);
    setEditEmail(detail.email);
    setEditCity(detail.city);
    setEditNotes(detail.notes || '');
    setEditErrors({});
    setSaveError('');
    setPanel('edit');
    setSkillsLoading(true);
    try {
      const skills = await getSkills();
      setAllSkills(skills);
      setEditSkillIds(skills.filter(s => detail.skills.includes(s.name)).map(s => s.id));
    } finally {
      setSkillsLoading(false);
    }
  };

  const toggleSkill = (id: number) =>
    setEditSkillIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const validateEdit = () => {
    const e: Record<string, string> = {};
    if (!editFirst.trim()) e.firstName = 'Required';
    else if (editFirst.trim().length < 3) e.firstName = 'At least 3 characters';
    if (!editLast.trim()) e.lastName = 'Required';
    else if (editLast.trim().length < 3) e.lastName = 'At least 3 characters';
    if (!editEmail.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) e.email = 'Invalid email';
    if (!editCity.trim()) e.city = 'Required';
    setEditErrors(e);
    return Object.keys(e).length === 0;
  };

  const doSave = async () => {
    if (!validateEdit()) return;
    setSaving(true);
    setSaveError('');
    try {
      await editTemp(detail.id, {
        firstName: editFirst !== detail.firstName ? editFirst : undefined,
        lastName:  editLast  !== detail.lastName  ? editLast  : undefined,
        email:     editEmail !== detail.email     ? editEmail : undefined,
        city:      editCity  !== detail.city      ? editCity  : undefined,
        notes:     editNotes !== (detail.notes || '') ? editNotes : undefined,
        skillIds:  editSkillIds,
      });
      onRefresh();
      onSuccess('Temp updated', `${editFirst} ${editLast} has been updated.`);
      setPanel('view');
    } catch (err: any) {
      const d = err.data?.details;
      setSaveError(d ? (Object.values(d).flat() as string[])[0] : err.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  return (
    <>
      {/* Header */}
      <div className="px-5 py-5 border-b border-border flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-toplayer flex items-center justify-center text-text text-lg font-medium shrink-0">
          {initials(detail.firstName, detail.lastName)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl text-text">{detail.firstName} {detail.lastName}</h2>
          <div className="flex items-center gap-1.5 text-secondary text-sm mt-1">
            <FontAwesomeIcon icon="user" className="text-xs" />{detail.email}
          </div>
          <div className="flex items-center gap-1.5 text-secondary text-sm mt-0.5">
            <FontAwesomeIcon icon="location-dot" className="text-xs" />{detail.city}
          </div>
          <div className="mt-2"><RatingBar value={detail.rating} /></div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Skills — clickable */}
        <div>
          <p className="text-xs text-inactive uppercase tracking-wider mb-2">
            <FontAwesomeIcon icon="screwdriver-wrench" className="mr-1.5" />Skills
            <span className="normal-case ml-1 opacity-60">(click to see jobs)</span>
          </p>
          {detail.skills?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {detail.skills.map(s => (
                <button
                  key={s}
                  onClick={() => onSkillClick(s)}
                  className="skill-tag hover:bg-toplayer hover:border-secondary transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : <p className="text-inactive text-xs">No skills listed</p>}
        </div>

        {/* Notes */}
        {detail.notes && (
          <div>
            <p className="text-xs text-inactive uppercase tracking-wider mb-2">Notes</p>
            <p className="text-secondary text-sm leading-relaxed italic">"{detail.notes}"</p>
          </div>
        )}

        {/* Jobs — clickable, with review for completed */}
        <div>
          <p className="text-xs text-inactive uppercase tracking-wider mb-2">
            <FontAwesomeIcon icon="briefcase" className="mr-1.5" />
            Jobs ({detail.jobs?.length || 0})
            <span className="normal-case ml-1 opacity-60">(click to view)</span>
          </p>
          {detail.jobs?.length > 0 ? (
            <div className="space-y-1">
              {detail.jobs.map(j => (
                <div key={j.id}>
                  <div
                    onClick={() => onJobClick(j.id)}
                    className="flex items-center justify-between py-2 border-b border-border/50 cursor-pointer hover:bg-border/20 rounded px-2 -mx-2 transition-colors"
                  >
                    <div>
                      <p className="text-text text-sm hover:text-highlight transition-colors">{j.name}</p>
                      <p className="text-inactive text-xs">
                        {formatDate(j.startDate)} – {formatDate(j.endDate)}
                      </p>
                    </div>
                    <span className={`text-xs ${STATUS_COLOR[j.status] || 'text-inactive'}`}>{j.status}</span>
                  </div>
                  {j.status === 'COMPLETED' && j.review && (
                    <div className="ml-2 mb-2 mt-1 bg-bg/50 rounded-sm px-3 py-2">
                      <div className="flex gap-3 text-xs">
                        <span className="text-inactive">Quality <span className="text-highlight font-medium">{j.review.workQuality}/5</span></span>
                        <span className="text-inactive">Comms <span className="text-highlight font-medium">{j.review.communication}/5</span></span>
                        <span className="text-inactive">On time <span className="text-highlight font-medium">{j.review.onTime}/5</span></span>
                      </div>
                      {j.review.comments && (
                        <p className="text-inactive text-xs italic mt-1">"{j.review.comments}"</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-inactive text-xs">No jobs assigned</p>}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <Button icon="user-plus" onClick={onAssignJob} className="text-xs py-1.5 px-3">
            Assign to job
          </Button>
          <Button icon="pen" onClick={openEdit} className="text-xs py-1.5 px-3">
            Edit temp
          </Button>
          <Button icon="trash" danger onClick={onDelete} className="text-xs py-1.5 px-3">
            Delete
          </Button>
        </div>
      </div>

      {/* Edit panel */}
      {panel === 'edit' && (
        <div className="px-5 py-4 border-t border-border bg-bg/30">
          <p className="text-xs text-inactive uppercase tracking-wider mb-3">Edit Temp</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input className="input text-sm" value={editFirst} onChange={e => setEditFirst(e.target.value)} placeholder="First name" />
                <FieldError message={editErrors.firstName} />
              </div>
              <div>
                <input className="input text-sm" value={editLast} onChange={e => setEditLast(e.target.value)} placeholder="Last name" />
                <FieldError message={editErrors.lastName} />
              </div>
            </div>
            <div>
              <input type="email" className="input text-sm" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email" />
              <FieldError message={editErrors.email} />
            </div>
            <div>
              <select className="input text-sm appearance-none" value={editCity} onChange={e => setEditCity(e.target.value)}>
                <option value="">Select a city...</option>
                {['Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Hobart', 'Darwin'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <FieldError message={editErrors.city} />
            </div>
            <textarea className="input text-sm resize-none" rows={2} value={editNotes}
              onChange={e => setEditNotes(e.target.value)} placeholder="Notes (optional)" />

            {/* Skills selector */}
            <div>
              <p className="text-xs text-inactive mb-1.5">Skills</p>
              {skillsLoading ? (
                <p className="text-inactive text-xs animate-pulse">Loading skills...</p>
              ) : allSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allSkills.map(s => (
                    <button key={s.id} type="button" onClick={() => toggleSkill(s.id)}
                      className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                        editSkillIds.includes(s.id)
                          ? 'bg-toplayer border-toplayer text-text'
                          : 'border-border text-inactive hover:border-secondary'
                      }`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {saveError && (
              <p className="text-orange-400 text-xs flex items-center gap-1.5">
                <FontAwesomeIcon icon="xmark" />{saveError}
              </p>
            )}
            <div className="flex gap-2">
              <Button icon="check" disabled={saving} onClick={doSave} className="text-xs py-1.5 px-3">Save</Button>
              <Button icon="xmark" onClick={() => setPanel('view')} className="text-xs py-1.5 px-3">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
