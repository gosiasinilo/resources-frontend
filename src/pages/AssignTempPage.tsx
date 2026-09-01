import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getJobById, assignTemp, recommendTemp, getAvailableTemps } from '../services/job-services';
import type { Job, AvailableTemp } from '../services/types';
import { formatDate } from './utils/date';
import Button from '../components/Button/Button';
import Paper from '../components/Paper';
import SuccessBanner from '../components/SuccessBanner/SuccessBanner';

type SortOption = 'skills' | 'rating' | 'distance';
type Rec = { tempId: number; firstName: string; lastName: string; reasoning: string };

function sameCity(a?: string | null, b?: string | null) {
  return !!(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
}
function initials(f: string, l: string) { return `${f[0]}${l[0]}`.toUpperCase(); }

interface TempRowProps {
  temp: AvailableTemp;
  job: Job;
  rec: Rec | null;
  assigning: number | null;
  error?: string;
  unavailable?: boolean;
  onAssign: (t: AvailableTemp) => void;
}

function TempRow({ temp, job, rec, assigning, error, unavailable: isUnavail, onAssign }: TempRowProps) {
  const recommended = rec?.tempId === temp.id;
  const cityMatch = sameCity(temp.city, job.city);
  const totalSkills = job.requiredSkills?.length ?? 0;
  return (
    <Paper className={`p-4 ${recommended ? 'border-highlight/30 bg-highlight/5' : isUnavail ? 'opacity-55' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
            recommended ? 'bg-highlight text-bg' : 'bg-toplayer text-text'
          }`}>
            {initials(temp.firstName, temp.lastName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-text text-sm font-medium">{temp.firstName} {temp.lastName}</p>
              {recommended && (
                <span className="text-xs text-highlight font-medium">
                  <FontAwesomeIcon icon="wand-magic-sparkles" className="mr-0.5" />AI pick
                </span>
              )}
              {cityMatch && !isUnavail && job.jobType === 'LOCATION' && (
                <span className="text-xs text-highlight">
                  <FontAwesomeIcon icon="location-dot" className="mr-0.5" />same city
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-inactive mt-0.5 flex-wrap">
              <span><FontAwesomeIcon icon="location-dot" className="mr-0.5" />{temp.city}</span>
              {temp.rating && <span className="text-important">★ {Number(temp.rating).toFixed(1)}</span>}
              {totalSkills > 0 && (
                <span className={temp.matchingSkillCount === totalSkills ? 'text-highlight' : ''}>
                  <FontAwesomeIcon icon="screwdriver-wrench" className="mr-0.5" />
                  {temp.matchingSkillCount}/{totalSkills} skills
                </span>
              )}
              {isUnavail && (
                <span className="text-yellow-500">Available from {formatDate(temp.nextAvailableStart)}</span>
              )}
            </div>
            {recommended && rec?.reasoning && (
              <p className="text-xs text-highlight/80 mt-1 italic">"{rec.reasoning}"</p>
            )}
            {error && <p className="text-orange-400 text-xs mt-1"><FontAwesomeIcon icon="xmark" className="mr-1" />{error}</p>}
          </div>
        </div>
        {!isUnavail && (
          <Button icon="user-plus" disabled={assigning === temp.id} onClick={() => onAssign(temp)} className="shrink-0">
            {assigning === temp.id ? 'Assigning...' : 'Assign'}
          </Button>
        )}
      </div>
    </Paper>
  );
}

export default function AssignTempPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob]           = useState<Job | null>(null);
  const [temps, setTemps]       = useState<AvailableTemp[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sort, setSort]         = useState<SortOption>('skills');
  const [assigning, setAssigning] = useState<number | null>(null);
  const [errors, setErrors]     = useState<Record<number, string>>({});
  const [success, setSuccess]   = useState(false);
  const [assignedName, setAssignedName] = useState('');
  const [rec, setRec]           = useState<Rec | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState('');

  useEffect(() => {
    if (!jobId) return;
    Promise.all([
      getJobById(Number(jobId)),
      getAvailableTemps(Number(jobId)),
    ]).then(([j, t]) => { setJob(j); setTemps(t); })
      .finally(() => setLoading(false));
  }, [jobId]);

  const available   = temps.filter(t => t.available && t.id !== job?.temp?.id);
  const unavailable = temps.filter(t => !t.available && t.id !== job?.temp?.id);

  const sortFn = (a: AvailableTemp, b: AvailableTemp) => {
    if (sort === 'rating')   return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    if (sort === 'distance') return (sameCity(a.city, job?.city) ? 0 : 1) - (sameCity(b.city, job?.city) ? 0 : 1);
    return b.matchingSkillCount - a.matchingSkillCount;
  };
  const sortedAvailable = available.slice().sort(sortFn);

  const doAssign = async (temp: AvailableTemp) => {
    setAssigning(temp.id);
    setErrors({});
    try {
      await assignTemp(Number(jobId), temp.id);
      setAssignedName(`${temp.firstName} ${temp.lastName}`);
      setSuccess(true);
    } catch (err: any) {
      const d = err.data?.details;
      const msg = d ? (Object.values(d).flat() as string[])[0] : err.message || 'Assignment failed';
      setErrors(prev => ({ ...prev, [temp.id]: msg }));
    } finally { setAssigning(null); }
  };

  const doRecommend = async () => {
    setRecLoading(true);
    setRecError('');
    setRec(null);
    try {
      setRec(await recommendTemp(Number(jobId)));
    } catch (err: any) {
      setRecError(err.data?.details?.api?.[0] || err.data?.details?.temps?.[0] || err.message || 'Recommendation failed');
    } finally { setRecLoading(false); }
  };

  if (success && job) {
    return (
      <SuccessBanner
        title="Temp assigned"
        message={`${assignedName} has been assigned to "${job.name}".`}
        onContinue={() => navigate(`/jobs?selected=${jobId}`)}
      />
    );
  }

  if (loading) return <p className="text-secondary text-sm py-8 animate-pulse">Loading...</p>;
  if (!job) return <p className="text-inactive text-sm py-8">Job not found.</p>;

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate(`/jobs?selected=${jobId}`)}
        className="flex items-center gap-2 text-inactive hover:text-secondary text-sm mb-6 transition-colors"
      >
        <FontAwesomeIcon icon="chevron-left" className="text-xs" />
        Back to jobs
      </button>

      <div className="mb-6">
        <p className="text-inactive text-xs uppercase tracking-wider mb-1">Assign Temp</p>
        <h1 className="font-display text-3xl text-text flex items-center gap-3">
          <FontAwesomeIcon icon="user-plus" className="text-highlight text-2xl" />
          {job.name}
        </h1>
        <p className="text-inactive text-sm mt-1 flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <FontAwesomeIcon icon="calendar" className="text-xs" />
            {formatDate(job.startDate)} – {formatDate(job.endDate)}
          </span>
          {job.city ? (
            <span className="flex items-center gap-1">
              <FontAwesomeIcon icon="location-dot" className="text-xs" />{job.city}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <FontAwesomeIcon icon="globe" className="text-xs" />Online
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-inactive">Sort:</span>
          {([
            { key: 'skills',   label: 'Skills' },
            { key: 'rating',   label: 'Rating' },
            ...(job.jobType === 'LOCATION' ? [{ key: 'distance' as SortOption, label: 'Distance' }] : []),
          ] as { key: SortOption; label: string }[]).map(({ key, label }) => (
            <button key={key} onClick={() => setSort(key)}
              className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                sort === key ? 'bg-toplayer border-toplayer text-text' : 'border-border text-inactive hover:border-secondary'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={doRecommend}
          disabled={recLoading || available.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-highlight/10 border border-highlight/30 text-highlight text-xs rounded-sm hover:bg-highlight/20 transition-colors disabled:opacity-40"
        >
          <FontAwesomeIcon icon={recLoading ? 'circle-notch' : 'wand-magic-sparkles'} className={recLoading ? 'animate-spin' : ''} />
          {recLoading ? 'Thinking...' : 'AI Recommend'}
        </button>
      </div>

      {recError && (
        <p className="text-orange-400 text-xs bg-orange-950/30 border border-orange-900/40 rounded px-3 py-2 mb-4">
          <FontAwesomeIcon icon="xmark" className="mr-1.5" />{recError}
        </p>
      )}

      {temps.length === 0 ? (
        <Paper padded className="text-center">
          <FontAwesomeIcon icon="user-group" className="text-border text-3xl mb-3 block mx-auto" />
          <p className="text-inactive text-sm">No temps available for these dates.</p>
        </Paper>
      ) : (
        <div className="space-y-2">
          {rec && (() => {
            const recTemp = available.find(t => t.id === rec.tempId);
            if (!recTemp || sortedAvailable[0]?.id === rec.tempId) return null;
            return (
              <>
                <p className="text-xs text-highlight uppercase tracking-wider pb-1">AI Recommendation</p>
                <TempRow temp={recTemp} job={job} rec={rec} assigning={assigning} error={errors[recTemp.id]} onAssign={doAssign} />
                <p className="text-xs text-inactive uppercase tracking-wider pt-2 pb-1">All available</p>
              </>
            );
          })()}

          {sortedAvailable.map(t => (
            <TempRow key={t.id} temp={t} job={job} rec={rec} assigning={assigning} error={errors[t.id]} onAssign={doAssign} />
          ))}

          {unavailable.length > 0 && (
            <>
              <p className="text-inactive text-xs pt-3 pb-1 uppercase tracking-wider">Unavailable for these dates</p>
              {unavailable.map(t => (
                <TempRow key={t.id} temp={t} job={job} rec={rec} assigning={assigning} unavailable onAssign={doAssign} />
              ))}
            </>
          )}

          <p className="text-inactive text-xs pt-2">
            {available.length} available · {unavailable.length} unavailable
          </p>
        </div>
      )}
    </div>
  );
}
