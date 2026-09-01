import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { unassignTemp, completeJob, deleteJob, editJob, closeJob } from '../../services/job-services';
import { getAvailableJobsForTemp } from '../../services/temp-services';
import { getSkills } from '../../services/skill-services';
import type { Job, Skill } from '../../services/types';
import { formatDate, isFutureOrToday } from '../../pages/utils/date';
import Button from '../Button/Button';
import FieldError from '../FieldError/FieldError';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import SkillJobsModal from '../SkillJobsModal/SkillJobsModal';

export const BADGE_CLASS: Record<string, string> = {
  INITIATED: 'badge badge-initiated',
  ASSIGNED:  'badge badge-assigned',
  IN_PROGRESS: 'badge badge-active',
  COMPLETED: 'badge badge-completed',
};

const STATUS_ICON: Record<string, any> = {
  INITIATED: 'clock',
  ASSIGNED:  'user',
  IN_PROGRESS: 'circle-check',
  COMPLETED: 'check',
};

function Stars({ value }: { value?: number | null }) {
  if (!value) return <span className="text-inactive text-xs">No rating</span>;
  const n = Math.round(Number(value));
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <FontAwesomeIcon key={i} icon={i <= n ? 'star' : ['far','star']}
          className={i <= n ? 'text-important text-xs' : 'text-border text-xs'} />
      ))}
      <span className="text-important text-xs ml-1">{Number(value).toFixed(1)}</span>
    </span>
  );
}

interface JobCardProps {
  job: Job;
  startExpanded?: boolean;
  detailMode?: boolean;
  onRefresh: () => void;
  onSuccess: (title: string, message: string) => void;
}

export default function JobCard({ job, startExpanded = false, detailMode = false, onRefresh, onSuccess }: JobCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded]         = useState(startExpanded);
  const [panel, setPanel]               = useState<'actions' | 'edit' | 'review'>('actions');
  const [allSkills, setAllSkills]       = useState<Skill[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmUnassign, setShowConfirmUnassign] = useState(false);
  const [skillModal, setSkillModal] = useState<string | null>(null);
  const [unavailableInfo, setUnavailableInfo] = useState<{ nextAvailableStart: string } | null>(null);

  const [editName, setEditName]               = useState(job.name);
  const [editDescription, setEditDescription] = useState(job.description || '');
  const [editJobType, setEditJobType]         = useState<'ONLINE' | 'LOCATION'>(job.jobType);
  const [editStartDate, setEditStartDate]     = useState(job.startDate);
  const [editEndDate, setEditEndDate]         = useState(job.endDate);
  const [editCity, setEditCity]               = useState(job.city || '');
  const [editSkills, setEditSkills]           = useState<number[]>([]);
  const [editErrors, setEditErrors]           = useState<Record<string, string>>({});

  const [workQuality, setWorkQuality]     = useState(5);
  const [communication, setCommunication] = useState(5);
  const [onTime, setOnTime]               = useState(5);
  const [comments, setComments]           = useState('Add comments ...');

  const canEditStartDate = job.status === 'INITIATED' && isFutureOrToday(job.startDate);
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = ['INITIATED', 'ASSIGNED', 'IN_PROGRESS'].includes(job.status) && job.endDate < today;

  useEffect(() => {
    if (!detailMode) return;
    setPanel('actions');
    setError('');
    if (job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS' || job.status === 'INITIATED') {
      getSkills().then(setAllSkills).catch(() => {});
    }
  }, [detailMode, job.id, job.status]);

  const handleExpand = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    setPanel('actions');
    setError('');
    if (job.status === 'ASSIGNED' || job.status === 'IN_PROGRESS' || job.status === 'INITIATED') {
      try { setAllSkills(await getSkills()); } catch { }
    }
  };

  const openEdit = () => {
    setEditName(job.name);
    setEditDescription(job.description || '');
    setEditJobType(job.jobType);
    setEditStartDate(job.startDate);
    setEditEndDate(job.endDate);
    setEditCity(job.city || '');
    setEditSkills(allSkills.filter(s => job.requiredSkills.includes(s.name)).map(s => s.id));
    setEditErrors({});
    setError('');
    setUnavailableInfo(null);
    setPanel('edit');
  };

  const validateEdit = () => {
    const e: Record<string, string> = {};
    if (!editName.trim()) e.name = 'Name is required';
    if (editName.trim().length < 4) e.name = 'At least 4 characters';
    if (canEditStartDate && !editStartDate) e.startDate = 'Required';
    if (canEditStartDate && editStartDate && editStartDate < today) e.startDate = 'Start date cannot be in the past';
    if (!editEndDate) e.endDate = 'Required';
    if (editEndDate && editStartDate && editEndDate <= editStartDate) e.endDate = 'Must be after start date';
    if (editJobType === 'LOCATION' && !editCity.trim()) e.city = 'City is required';
    setEditErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveEdit = async (andUnassign = false) => {
    setLoading(true);
    setUnavailableInfo(null);
    try {
      if (andUnassign) await unassignTemp(job.id);
      await editJob(job.id, {
        name: editName,
        description: editDescription || undefined,
        jobType: editJobType,
        startDate: canEditStartDate ? editStartDate : undefined,
        endDate: editEndDate,
        city: editJobType === 'LOCATION' ? (editCity || undefined) : undefined,
        requiredSkillIds: editSkills,
      });
      onRefresh();
      if (!detailMode) setExpanded(false);
      onSuccess('Job updated', `"${editName}" has been updated.${andUnassign ? ' Temp unassigned.' : ''}`);
      setPanel('actions');
    } catch (err: any) {
      const d = err.data?.details;
      setError(d ? (Object.values(d).flat() as string[])[0] : err.message || 'Failed to update');
    } finally { setLoading(false); }
  };

  const doEdit = async () => {
    if (!validateEdit()) return;

    const newStart = canEditStartDate ? editStartDate : job.startDate;
    const newEnd   = editEndDate;
    const datesChanged = newEnd !== job.endDate || (canEditStartDate && newStart !== job.startDate);
    const rangeExpanded = newStart < job.startDate || newEnd > job.endDate;

    if (job.temp && datesChanged && rangeExpanded) {
      setLoading(true);
      try {
        const temps = await getAvailableJobsForTemp(newStart, newEnd);
        const tempInfo = temps.find(t => t.id === job.temp!.id);
        if (tempInfo && !tempInfo.available) {
          setUnavailableInfo({ nextAvailableStart: tempInfo.nextAvailableStart });
          setLoading(false);
          return;
        }
      } catch { /**/ } finally { setLoading(false); }
    }

    await saveEdit();
  };

  const doClose = async () => {
    setLoading(true);
    try {
      await closeJob(job.id);
      onRefresh();
      onSuccess('Job closed', `"${job.name}" has been closed.`);
    } catch (err: any) { setError(err.message || 'Failed to close job'); }
    finally { setLoading(false); }
  };

  const doUnassign = async () => {
    setShowConfirmUnassign(false);
    setLoading(true);
    try {
      await unassignTemp(job.id);
      onRefresh();
      onSuccess('Temp unassigned', 'The temp has been removed from this job.');
    } catch (err: any) { setError(err.message || 'Failed to unassign'); }
    finally { setLoading(false); }
  };

  const doDelete = async () => {
    setShowConfirmDelete(false);
    setLoading(true);
    try {
      await deleteJob(job.id);
      onRefresh();
      onSuccess('Job deleted', `"${job.name}" has been deleted.`);
    } catch (err: any) { setError(err.message || 'Failed to delete'); }
    finally { setLoading(false); }
  };

  const doComplete = async () => {
    setLoading(true);
    try {
      await completeJob(job.id, { workQuality, communication, onTime, comments: comments || undefined });
      onRefresh();
      if (!detailMode) setExpanded(false);
      onSuccess('Job completed', `"${job.name}" has been marked as complete.`);
      setPanel('actions');
    } catch (err: any) {
      const d = err.data?.details;
      setError(d ? (Object.values(d).flat() as string[])[0] : err.message || 'Failed to complete');
    } finally { setLoading(false); }
  };

  const toggleEditSkill = (id: number) =>
    setEditSkills(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  const ScoreRow = ({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) => (
    <div>
      <p className="text-xs text-inactive mb-1.5">{label}</p>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`w-8 h-8 rounded border text-xs transition-colors ${
              value >= n ? 'bg-toplayer border-toplayer text-text' : 'border-border text-inactive hover:border-secondary'
            }`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );

  const expandedContent = (
    <>
      {panel === 'actions' && (
        <div className="border-t border-border px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-inactive uppercase tracking-wider mb-3">Description</p>
            {job.description
              ? <p className="text-secondary text-sm leading-relaxed">{job.description}</p>
              : <p className="text-inactive text-xs italic">No description provided.</p>
            }
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-xs text-inactive uppercase tracking-wider mb-3">Details</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-inactive">Type</span>
                  <span className="flex items-center gap-1.5 text-secondary">
                    <FontAwesomeIcon icon={job.jobType === 'ONLINE' ? 'globe' : 'location-dot'} />{job.jobType}
                  </span>
                </div>
                {job.city && <div className="flex justify-between"><span className="text-inactive">City</span><span className="text-secondary">{job.city}</span></div>}
                <div className="flex justify-between">
                  <span className="text-inactive">Dates</span>
                  <span className="text-secondary">{formatDate(job.startDate)} – {formatDate(job.endDate)}</span>
                </div>
                {job.temp && (
                  <div className="flex justify-between">
                    <span className="text-inactive">Temp</span>
                    <button
                      onClick={() => navigate(`/temps?selected=${job.temp!.id}`)}
                      className="text-highlight underline decoration-dotted hover:opacity-80"
                    >
                      {job.temp.firstName} {job.temp.lastName}
                    </button>
                  </div>
                )}
                {job.requiredSkills?.length > 0 && (
                  <div className="flex justify-between gap-4 items-start">
                    <span className="text-inactive shrink-0">Skills</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {job.requiredSkills.map(s => (
                        <button key={s} type="button" onClick={e => { e.stopPropagation(); setSkillModal(s); }}
                          className="skill-tag hover:bg-toplayer hover:border-secondary transition-colors cursor-pointer">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {job.review && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-inactive uppercase tracking-wider mb-2">Review</p>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {[
                        { label: 'Quality', val: job.review.workQuality },
                        { label: 'Comms', val: job.review.communication },
                        { label: 'On time', val: job.review.onTime },
                      ].map(({ label, val }) => (
                        <div key={label} className="bg-bg rounded-sm p-2 text-center">
                          <p className="font-display text-lg text-highlight">{val}</p>
                          <p className="text-xs text-inactive mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                    {job.review.comments && (
                      <p className="text-xs text-inactive italic">"{job.review.comments}"</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-inactive uppercase tracking-wider mb-3">Actions</p>
              {error && (
                <div className="mb-3 text-orange-400 text-xs bg-orange-950/30 border border-orange-900/40 rounded-sm px-3 py-2 flex items-start gap-2">
                  <FontAwesomeIcon icon="xmark" className="mt-0.5 shrink-0" />{error}
                </div>
              )}
              <div className="space-y-2">
                {job.status === 'INITIATED' && (<>
                  {isOverdue ? (
                    <Button icon="xmark-circle" fullWidth disabled={loading} onClick={doClose}>Close job</Button>
                  ) : (
                    <Button icon="user-plus" fullWidth onClick={() => navigate(`/jobs/${job.id}/assign`)}>Assign temp...</Button>
                  )}
                  <Button icon="pen" fullWidth onClick={openEdit}>Edit job</Button>
                  <Button icon="trash" fullWidth danger onClick={() => setShowConfirmDelete(true)}>Delete job</Button>
                </>)}

                {job.status === 'ASSIGNED' && (<>
                  {isOverdue ? (
                    <Button icon="circle-check" fullWidth onClick={() => { setPanel('review'); setError(''); }}>Close + review</Button>
                  ) : (<>
                    <Button icon="user-plus" fullWidth onClick={() => navigate(`/jobs/${job.id}/assign`)}>Change temp</Button>
                    <Button icon="user-minus" fullWidth disabled={loading} onClick={() => setShowConfirmUnassign(true)}>Unassign temp</Button>
                  </>)}
                  <Button icon="pen" fullWidth onClick={openEdit}>Edit job</Button>
                  <Button icon="trash" fullWidth danger onClick={() => setShowConfirmDelete(true)}>Delete job</Button>
                </>)}

                {job.status === 'IN_PROGRESS' && (<>
                  <Button icon="circle-check" fullWidth onClick={() => { setPanel('review'); setError(''); }}>
                    {isOverdue ? 'Close + review' : 'Complete + review'}
                  </Button>
                  <Button icon="pen" fullWidth onClick={openEdit}>Edit job</Button>
                  <Button icon="trash" fullWidth danger onClick={() => setShowConfirmDelete(true)}>Delete (unassigns temp)</Button>
                </>)}

                {job.status === 'COMPLETED' && (
                  <p className="text-inactive text-xs">This job has been completed.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {panel === 'edit' && (
        <div className="border-t border-border bg-bg/40 px-4 sm:px-6 py-5">
          <p className="text-xs text-inactive uppercase tracking-wider mb-4">Edit Job</p>
          <div className="space-y-3">
            <div>
              <input className="input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Job name" />
              <FieldError message={editErrors.name} />
            </div>
            <textarea className="input resize-none" rows={2} value={editDescription}
              onChange={e => setEditDescription(e.target.value)} placeholder="Description (optional)" />
            <div>
              <p className="text-xs text-inactive mb-1.5">Job type</p>
              <div className="flex gap-1.5">
                {(['ONLINE', 'LOCATION'] as const).map(t => (
                  <button key={t} type="button" onClick={() => { setEditJobType(t); if (t === 'ONLINE') setEditCity(''); }}
                    className={`px-3 py-1.5 rounded-full border text-xs transition-colors flex items-center gap-1.5 ${
                      editJobType === t ? 'bg-toplayer border-toplayer text-text' : 'border-border text-inactive hover:border-secondary'
                    }`}>
                    <FontAwesomeIcon icon={t === 'ONLINE' ? 'globe' : 'location-dot'} className="text-xs" />
                    {t === 'ONLINE' ? 'Online' : 'On-site'}
                  </button>
                ))}
              </div>
            </div>
            {editJobType === 'LOCATION' && (
              <div>
                <div className="relative">
                  <FontAwesomeIcon icon="location-dot" className="absolute left-3 top-1/2 -translate-y-1/2 text-inactive text-xs pointer-events-none" />
                  <select className="input pl-8 appearance-none" value={editCity} onChange={e => setEditCity(e.target.value)}>
                    <option value="">Select a city...</option>
                    {['Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Hobart', 'Darwin'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <FieldError message={editErrors.city} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-inactive mb-1">Start date</p>
                {canEditStartDate ? (
                  <>
                    <input type="date" className="input" min={today} value={editStartDate} onChange={e => setEditStartDate(e.target.value)} />
                    <FieldError message={editErrors.startDate} />
                  </>
                ) : (
                  <div className="input bg-bg/40 text-inactive cursor-not-allowed">
                    {formatDate(job.startDate)}
                  </div>
                )}
                {!canEditStartDate && (
                  <p className="text-inactive text-xs mt-1">Cannot edit — job already started</p>
                )}
              </div>
              <div>
                <p className="text-xs text-inactive mb-1">End date</p>
                <input type="date" className="input" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} />
                <FieldError message={editErrors.endDate} />
              </div>
            </div>
            {allSkills.length > 0 && (
              <div>
                <p className="text-xs text-inactive mb-1.5">Required skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {allSkills.map(s => (
                    <button key={s.id} type="button" onClick={() => toggleEditSkill(s.id)}
                      className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                        editSkills.includes(s.id)
                          ? 'bg-toplayer border-toplayer text-text'
                          : 'border-border text-inactive hover:border-secondary'
                      }`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {error && <p className="text-orange-400 text-xs flex items-center gap-1.5"><FontAwesomeIcon icon="xmark" />{error}</p>}
            {unavailableInfo && (
              <div className="bg-yellow-950/30 border border-yellow-700/40 rounded-sm px-3 py-3 space-y-2">
                <p className="text-yellow-300 text-xs font-medium flex items-center gap-1.5">
                  <FontAwesomeIcon icon="triangle-exclamation" />
                  {job.temp?.firstName} {job.temp?.lastName} is not available on these dates
                </p>
                <p className="text-yellow-400/70 text-xs">
                  Next available from: {formatDate(unavailableInfo.nextAvailableStart)}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button icon="user-minus" disabled={loading} onClick={() => saveEdit(true)}>
                    Save & unassign {job.temp?.firstName}
                  </Button>
                  <Button icon="xmark" onClick={() => setUnavailableInfo(null)}>Cancel</Button>
                </div>
              </div>
            )}
            {!unavailableInfo && (
              <div className="flex gap-2 pt-1">
                <Button icon="check" disabled={loading} onClick={doEdit}>Save changes</Button>
                <Button icon="xmark" onClick={() => { setPanel('actions'); setError(''); setUnavailableInfo(null); }}>Cancel</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {panel === 'review' && (
        <div className="border-t border-border bg-bg/40 px-4 sm:px-6 py-5">
          <p className="text-xs text-inactive uppercase tracking-wider mb-4">Complete + Review</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <ScoreRow label="Work quality"  value={workQuality}   onChange={setWorkQuality} />
            <ScoreRow label="Communication" value={communication} onChange={setCommunication} />
            <ScoreRow label="On time"       value={onTime}        onChange={setOnTime} />
          </div>
          <textarea className="input mb-4 resize-none" rows={2}
            placeholder="Comments (optional)" value={comments}
            onChange={e => setComments(e.target.value)} />
          {error && <p className="text-orange-400 text-xs mb-3 flex items-center gap-1.5"><FontAwesomeIcon icon="xmark" />{error}</p>}
          <div className="flex gap-2">
            <Button icon="circle-check" disabled={loading} onClick={doComplete}>Submit & complete</Button>
            <Button icon="xmark" onClick={() => { setPanel('actions'); setError(''); }}>Cancel</Button>
          </div>
        </div>
      )}
    </>
  );

  if (detailMode) {
    return (
      <>
        {skillModal && (
          <SkillJobsModal
            skillName={skillModal}
            onClose={() => setSkillModal(null)}
            onJobClick={jobId => { setSkillModal(null); navigate(`/jobs?selected=${jobId}`); }}
          />
        )}
        {showConfirmDelete && (
          <ConfirmModal
            message={`Delete "${job.name}"?`}
            subMessage={job.temp ? 'This will unassign the temp.' : 'This cannot be undone.'}
            confirmLabel="Delete"
            onConfirm={doDelete}
            onCancel={() => setShowConfirmDelete(false)}
          />
        )}
        {showConfirmUnassign && (
          <ConfirmModal
            message="Unassign temp?"
            subMessage={`Remove ${job.temp?.firstName} ${job.temp?.lastName} from this job?`}
            confirmLabel="Unassign"
            danger={false}
            onConfirm={doUnassign}
            onCancel={() => setShowConfirmUnassign(false)}
          />
        )}
        <div className="overflow-hidden">
          <div className="px-5 py-5 border-b border-border flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl text-text">{job.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-secondary flex-wrap">
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon="calendar" className="text-xs" />
                  {formatDate(job.startDate)} – {formatDate(job.endDate)}
                </span>
                {job.city && (
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon="location-dot" className="text-xs" />{job.city}
                  </span>
                )}
              </div>
              {job.temp && (
                <button
                  onClick={() => navigate(`/temps?selected=${job.temp!.id}`)}
                  className="mt-1 text-xs text-highlight underline decoration-dotted hover:opacity-80"
                >
                  {job.temp.firstName} {job.temp.lastName}
                  {job.temp.rating && <Stars value={job.temp.rating} />}
                </button>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={`${BADGE_CLASS[job.status]}`}>
                <FontAwesomeIcon icon={STATUS_ICON[job.status]} className="text-xs" />
                <span className="ml-1">{job.status}</span>
              </span>
              {isOverdue && (
                <span className="text-xs text-orange-400 border border-orange-800/40 rounded px-1.5 py-0.5 bg-orange-950/20">
                  To close
                </span>
              )}
            </div>
          </div>
          {expandedContent}
        </div>
      </>
    );
  }

  return (
    <>
      {skillModal && (
        <SkillJobsModal
          skillName={skillModal}
          onClose={() => setSkillModal(null)}
          onJobClick={jobId => { setSkillModal(null); navigate(`/jobs?selected=${jobId}`); }}
        />
      )}
      {showConfirmDelete && (
        <ConfirmModal
          message={`Delete "${job.name}"?`}
          subMessage={job.temp ? 'This will unassign the temp.' : 'This cannot be undone.'}
          confirmLabel="Delete"
          onConfirm={doDelete}
          onCancel={() => setShowConfirmDelete(false)}
        />
      )}
      {showConfirmUnassign && (
        <ConfirmModal
          message="Unassign temp?"
          subMessage={`Remove ${job.temp?.firstName} ${job.temp?.lastName} from this job?`}
          confirmLabel="Unassign"
          danger={false}
          onConfirm={doUnassign}
          onCancel={() => setShowConfirmUnassign(false)}
        />
      )}

      <div className="bg-paper border border-border rounded overflow-hidden">
        {/* Header row */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-border/20 transition-colors"
          onClick={handleExpand}
        >
          <div className="w-24 shrink-0 flex">
            <span className={`${BADGE_CLASS[job.status]} w-full justify-center`}>
              <FontAwesomeIcon icon={STATUS_ICON[job.status]} className="text-xs" />
              <span className="hidden sm:inline ml-1">{job.status}</span>
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-text font-medium text-sm truncate">{job.name}</p>
              {isOverdue && (
                <span className="shrink-0 text-xs text-orange-400 border border-orange-800/40 rounded px-1 py-0.5 bg-orange-950/20">
                  To close
                </span>
              )}
            </div>
            {job.description && (
              <p className="text-inactive text-xs truncate hidden sm:block mt-0.5">{job.description}</p>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-inactive justify-end">
                <FontAwesomeIcon icon="calendar" className="text-xs" />
                {formatDate(job.startDate)} — {formatDate(job.endDate)}
              </div>
              <div className="flex items-center gap-1 text-xs text-inactive justify-end mt-0.5">
                <FontAwesomeIcon icon={job.city ? 'location-dot' : 'globe'} className="text-xs" />
                {job.city || 'Online'}
              </div>
            </div>
            {job.temp ? (
              <button
                onClick={e => { e.stopPropagation(); navigate(`/temps?selected=${job.temp!.id}`); }}
                className="text-right hover:opacity-80 transition-opacity"
              >
                <p className="text-xs text-highlight underline decoration-dotted">
                  {job.temp.firstName} {job.temp.lastName}
                </p>
                <Stars value={job.temp.rating} />
              </button>
            ) : (
              <p className="text-xs text-inactive">Unassigned</p>
            )}
          </div>
          <FontAwesomeIcon
            icon={expanded ? 'chevron-up' : 'chevron-down'}
            className="text-inactive text-xs shrink-0 ml-1"
          />
        </div>

        {expanded && expandedContent}
      </div>
    </>
  );
}
