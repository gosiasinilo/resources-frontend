import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getJobs, assignTemp } from '../services/job-services';
import { getTempById } from '../services/temp-services';
import type { Job, TempDetail } from '../services/types';
import { formatDate } from './utils/date';
import Button from '../components/Button/Button';
import Paper from '../components/Paper';
import SuccessBanner from '../components/SuccessBanner/SuccessBanner';

type SortOption = 'date' | 'skills' | 'location';

function dateOverlap(s1: string, e1: string, s2: string, e2: string) {
  return s1 <= e2 && s2 <= e1;
}

function isTempAvailable(temp: TempDetail, job: Job) {
  return !temp.jobs.some(tj =>
    tj.status !== 'COMPLETED' &&
    dateOverlap(tj.startDate, tj.endDate, job.startDate, job.endDate)
  );
}

export default function AssignJobPage() {
  const { tempId } = useParams<{ tempId: string }>();
  const navigate = useNavigate();

  const [temp, setTemp]           = useState<TempDetail | null>(null);
  const [jobs, setJobs]           = useState<Job[]>([]);
  const [loading, setLoading]     = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [error, setError]         = useState<Record<number, string>>({});
  const [success, setSuccess]     = useState(false);
  const [assignedJobName, setAssignedJobName] = useState('');
  const [sort, setSort]           = useState<SortOption>('date');

  useEffect(() => {
    if (!tempId) return;
    Promise.all([
      getTempById(Number(tempId)),
      getJobs(0, 500, { status: 'INITIATED' }),
    ]).then(([t, allJobs]) => {
      setTemp(t);
      setJobs(allJobs.content);
    }).finally(() => setLoading(false));
  }, [tempId]);

  const handleAssign = async (job: Job) => {
    setAssigning(job.id);
    setError({});
    try {
      await assignTemp(job.id, Number(tempId));
      setAssignedJobName(job.name);
      setSuccess(true);
    } catch (err: any) {
      const d = err.data?.details;
      const msg = d
        ? (Object.values(d).flat() as string[])[0]
        : err.message || 'Assignment failed';
      setError(prev => ({ ...prev, [job.id]: msg }));
    } finally { setAssigning(null); }
  };

  const skillMatchCount = (job: Job) =>
    (job.requiredSkills ?? []).filter(s => temp?.skills?.includes(s)).length;

  const availableJobs = temp ? jobs.filter(j => isTempAvailable(temp, j)) : jobs;

  const sorted = availableJobs.slice().sort((a, b) => {
    if (sort === 'skills')   return skillMatchCount(b) - skillMatchCount(a);
    if (sort === 'location') {
      const score = (job: Job) =>
        job.jobType === 'ONLINE' ? 1
        : job.city?.toLowerCase() === temp?.city?.toLowerCase() ? 0
        : 2;
      return score(a) - score(b);
    }
    return a.startDate.localeCompare(b.startDate);
  });

  if (success) {
    return (
      <SuccessBanner
        title="Temp assigned"
        message={`${temp?.firstName} ${temp?.lastName} has been assigned to "${assignedJobName}".`}
        onContinue={() => navigate(`/temps?selected=${tempId}`)}
      />
    );
  }

  if (loading) return <p className="text-secondary text-sm py-8 animate-pulse">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate(`/temps?selected=${tempId}`)}
        className="flex items-center gap-2 text-inactive hover:text-secondary text-sm mb-6 transition-colors"
      >
        <FontAwesomeIcon icon="chevron-left" className="text-xs" />
        Back to temps
      </button>

      <div className="mb-6">
        <p className="text-inactive text-xs uppercase tracking-wider mb-1">Assigning</p>
        <h1 className="font-display text-3xl text-text flex items-center gap-3">
          <FontAwesomeIcon icon="user-plus" className="text-highlight text-2xl" />
          {temp ? `${temp.firstName} ${temp.lastName}` : 'Temp'}
        </h1>
        {temp && (
          <p className="text-inactive text-sm mt-1 flex items-center gap-1.5">
            <FontAwesomeIcon icon="location-dot" className="text-xs" />{temp.city}
          </p>
        )}
      </div>

      {sorted.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-inactive">Sort:</span>
          {([
            { key: 'date',     label: 'Date' },
            { key: 'skills',   label: 'Skills match' },
            { key: 'location', label: 'Distance' },
          ] as { key: SortOption; label: string }[]).map(({ key, label }) => (
            <button key={key} onClick={() => setSort(key)}
              className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                sort === key ? 'bg-toplayer border-toplayer text-text' : 'border-border text-inactive hover:border-secondary'
              }`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <Paper padded className="text-center">
          <FontAwesomeIcon icon="briefcase" className="text-border text-3xl mb-3 block mx-auto" />
          <p className="text-inactive text-sm">No available jobs for this temp.</p>
          <p className="text-inactive text-xs mt-1">
            {jobs.length > availableJobs.length
              ? `${jobs.length - availableJobs.length} job${jobs.length - availableJobs.length !== 1 ? 's' : ''} skipped due to date conflicts.`
              : 'All jobs are either assigned, active, or completed.'}
          </p>
        </Paper>
      ) : (
        <div className="space-y-3">
          <p className="text-inactive text-sm">
            {sorted.length} available job{sorted.length !== 1 ? 's' : ''}
            {jobs.length > availableJobs.length && (
              <span className="ml-1 text-xs">
                ({jobs.length - availableJobs.length} hidden — date conflict)
              </span>
            )}
          </p>
          {sorted.map(job => {
            const matched = skillMatchCount(job);
            const total = job.requiredSkills?.length ?? 0;
            const sameCity = temp?.city && job.city &&
              job.city.toLowerCase() === temp.city.toLowerCase();
            return (
              <Paper key={job.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-text font-medium text-sm">{job.name}</p>
                      {sameCity && (
                        <span className="text-xs text-highlight">
                          <FontAwesomeIcon icon="location-dot" className="mr-0.5" />same city
                        </span>
                      )}
                    </div>
                    {job.description && (
                      <p className="text-inactive text-xs mt-0.5 truncate">{job.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-inactive">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon="calendar" className="text-xs" />
                        {formatDate(job.startDate)} – {formatDate(job.endDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={job.city ? 'location-dot' : 'globe'} className="text-xs" />
                        {job.city || 'Online'}
                      </span>
                      {total > 0 && (
                        <span className={matched === total ? 'text-highlight' : ''}>
                          <FontAwesomeIcon icon="screwdriver-wrench" className="mr-0.5" />
                          {matched}/{total} skills
                        </span>
                      )}
                    </div>
                    {job.requiredSkills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.requiredSkills.map(s => (
                          <span key={s} className={`skill-tag ${
                            temp?.skills?.includes(s) ? 'border-highlight/50 text-highlight' : ''
                          }`}>
                            {s}
                            {temp?.skills?.includes(s) && (
                              <FontAwesomeIcon icon="check" className="text-xs ml-0.5" />
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    {error[job.id] && (
                      <p className="text-orange-400 text-xs mt-2 flex items-center gap-1">
                        <FontAwesomeIcon icon="xmark" />{error[job.id]}
                      </p>
                    )}
                  </div>
                  <Button
                    icon="user-plus"
                    disabled={assigning === job.id}
                    onClick={() => handleAssign(job)}
                    className="shrink-0"
                  >
                    {assigning === job.id ? 'Assigning...' : 'Assign'}
                  </Button>
                </div>
              </Paper>
            );
          })}
        </div>
      )}
    </div>
  );
}
