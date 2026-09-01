import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getJobs, getJobById } from '../services/job-services';
import type { Job, JobStatus, JobType } from '../services/types';
import JobCard, { BADGE_CLASS } from '../components/JobCard/JobCard';
import Paper from '../components/Paper';
import SuccessBanner from '../components/SuccessBanner/SuccessBanner';
import { formatDate } from './utils/date';

type StatusFilter = 'ALL' | JobStatus | 'OVERDUE';
type TypeFilter   = 'ALL' | JobType;
type SortOption   = 'az' | 'za' | 'date-asc' | 'date-desc' | 'location';

const STATUS_TABS: StatusFilter[] = ['ALL', 'INITIATED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'];

const STATUS_LABEL: Record<StatusFilter, string> = {
  ALL: 'All', INITIATED: 'Initiated', ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', OVERDUE: 'Overdue',
};

const STATUS_DOT: Record<string, string> = {
  INITIATED: 'bg-important', ASSIGNED: 'bg-highlight/50',
  IN_PROGRESS: 'bg-highlight', COMPLETED: 'bg-secondary', OVERDUE: 'bg-orange-500',
};

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'az',        label: 'A→Z' },
  { key: 'za',        label: 'Z→A' },
  { key: 'date-asc',  label: 'Date ↑' },
  { key: 'date-desc', label: 'Date ↓' },
  { key: 'location',  label: 'Location' },
];

function isOverdue(job: Job) {
  return ['INITIATED', 'ASSIGNED', 'IN_PROGRESS'].includes(job.status) &&
    job.endDate < new Date().toISOString().split('T')[0];
}

const PAGE_SIZE = 10;

type StatusCounts = Record<StatusFilter, number>;
type SuccessState = { title: string; message: string } | null;

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages: (number | '...')[] = [0];
  if (current > 2) pages.push('...');
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) pages.push(i);
  if (current < total - 3) pages.push('...');
  pages.push(total - 1);
  return pages;
}

export default function JobsPage() {
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get('selected') ? Number(searchParams.get('selected')) : null;

  const [jobs, setJobs]               = useState<Job[]>([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    ALL: 0, INITIATED: 0, ASSIGNED: 0, IN_PROGRESS: 0, COMPLETED: 0, OVERDUE: 0,
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter]     = useState<TypeFilter>('ALL');
  const [sort, setSort]                 = useState<SortOption>('date-desc');
  const [selectedId, setSelectedId]     = useState<number | null>(preSelectedId);
  const [preSelectedJob, setPreSelectedJob] = useState<Job | null>(null);
  const [success, setSuccess]           = useState<SuccessState>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  const buildOpts = useCallback((sf = statusFilter, tf = typeFilter, s = sort) => ({
    status:  sf === 'ALL' || sf === 'OVERDUE' ? undefined : sf,
    overdue: sf === 'OVERDUE',
    jobType: tf === 'ALL' ? undefined : tf,
    sort:    s,
  }), [statusFilter, typeFilter, sort]);

  const loadCounts = useCallback(() => {
    Promise.all([
      getJobs(0, 1),
      getJobs(0, 1, { status: 'INITIATED' }),
      getJobs(0, 1, { status: 'ASSIGNED' }),
      getJobs(0, 1, { status: 'IN_PROGRESS' }),
      getJobs(0, 1, { status: 'COMPLETED' }),
      getJobs(0, 1, { overdue: true }),
    ]).then(([all, init, asgn, prog, done, ov]) => {
      setStatusCounts({
        ALL: all.totalElements, INITIATED: init.totalElements,
        ASSIGNED: asgn.totalElements, IN_PROGRESS: prog.totalElements,
        COMPLETED: done.totalElements, OVERDUE: ov.totalElements,
      });
    });
  }, []);

  useEffect(() => { loadCounts(); }, []);

  useEffect(() => {
    setLoading(true);
    getJobs(page, PAGE_SIZE, buildOpts())
      .then(res => { setJobs(res.content); setTotalPages(res.totalPages); })
      .finally(() => setLoading(false));
  }, [page, statusFilter, typeFilter, sort]);

  useEffect(() => {
    if (!preSelectedId) return;
    setSelectedId(preSelectedId);
    getJobById(preSelectedId).then(setPreSelectedJob).catch(() => {});
  }, [preSelectedId]);

  useEffect(() => {
    if (selectedId && selectedItemRef.current) {
      setTimeout(() => selectedItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
  }, [selectedId]);

  const selectedJob = selectedId != null ? (jobs.find(j => j.id === selectedId) ?? preSelectedJob ?? null) : null;

  const handleSelect = (id: number) => setSelectedId(selectedId === id ? null : id);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    getJobs(page, PAGE_SIZE, buildOpts())
      .then(res => { setJobs(res.content); setTotalPages(res.totalPages); })
      .finally(() => setLoading(false));
    loadCounts();
  }, [page, buildOpts, loadCounts]);

  const changeFilter = (sf: StatusFilter) => {
    setStatusFilter(sf); setPage(0); setSelectedId(null);
  };
  const changeType = (tf: TypeFilter) => {
    setTypeFilter(tf); setPage(0); setSelectedId(null);
  };
  const changeSort = (s: SortOption) => {
    setSort(s); setPage(0); setSelectedId(null);
  };

  return (
    <>
      {success && (
        <SuccessBanner
          title={success.title}
          message={success.message}
          onContinue={() => setSuccess(null)}
        />
      )}

      <div>
        <div className="mb-4">
          <p className="text-inactive text-xs uppercase tracking-wider mb-1">Overview</p>
          <h1 className="font-display text-3xl text-text flex items-center gap-3">
            <FontAwesomeIcon icon="briefcase" className="text-highlight text-2xl" />Jobs
          </h1>
        </div>

        <div className="flex flex-wrap align-left border-b border-border mb-0">
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => changeFilter(s)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs border-b-2 -mb-px transition-colors whitespace-nowrap ${
                statusFilter === s
                  ? 'border-highlight text-highlight font-medium'
                  : 'border-transparent text-inactive hover:text-secondary'
              }`}>
              {s !== 'ALL' && (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[s] ?? 'bg-border'}`} />
              )}
              {STATUS_LABEL[s]}
              <span className="opacity-60">({statusCounts[s]})</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 py-3 border-b border-border mb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-inactive">Type:</span>
            {(['ALL', 'ONLINE', 'LOCATION'] as TypeFilter[]).map(t => (
              <button key={t} onClick={() => changeType(t)}
                className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                  typeFilter === t ? 'bg-toplayer border-toplayer text-text' : 'border-border text-inactive hover:border-secondary'
                }`}>
                {t === 'ALL' ? 'All types' : t === 'ONLINE' ? 'Online' : 'On-site'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-inactive">Sort:</span>
            {SORT_OPTIONS.map(({ key, label }) => (
              <button key={key} onClick={() => changeSort(key)}
                className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                  sort === key ? 'bg-toplayer border-toplayer text-text' : 'border-border text-inactive hover:border-secondary'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2">
            {loading ? (
              <p className="text-secondary text-sm py-4 animate-pulse">Loading jobs...</p>
            ) : jobs.length === 0 ? (
              <p className="text-inactive text-sm py-4">No jobs found.</p>
            ) : (
              <div className="space-y-2">
                {jobs.map(job => (
                  <div key={job.id} ref={job.id === selectedId ? selectedItemRef : null}>
                    <div
                      onClick={() => handleSelect(job.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded border cursor-pointer transition-all ${
                        selectedId === job.id
                          ? 'bg-toplayer/20 border-highlight/40'
                          : 'bg-paper border-border hover:border-secondary/40 hover:bg-paper/80'
                      }`}
                    >
                      <span className={`${BADGE_CLASS[job.status]} shrink-0 text-xs`}>
                        {job.status === 'IN_PROGRESS' ? 'IN PROG' : job.status}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-text font-medium text-sm truncate">{job.name}</p>
                          {isOverdue(job) && (
                            <span className="shrink-0 text-xs text-orange-400 border border-orange-800/40 rounded px-1 py-0.5 bg-orange-950/20">
                              To close
                            </span>
                          )}
                        </div>
                        <p className="text-inactive text-xs mt-0.5">
                          {formatDate(job.startDate)} – {formatDate(job.endDate)}
                          {job.city ? ` · ${job.city}` : ' · Online'}
                        </p>
                      </div>
                      {job.temp && (
                        <p className="text-xs text-highlight shrink-0 hidden sm:block truncate max-w-24">
                          {job.temp.firstName} {job.temp.lastName}
                        </p>
                      )}
                      <FontAwesomeIcon
                        icon={selectedId === job.id ? 'chevron-up' : 'chevron-down'}
                        className="text-inactive text-xs shrink-0"
                      />
                    </div>

                    {selectedId === job.id && (
                      <div className="lg:hidden mt-1 bg-paper border border-border rounded overflow-hidden">
                        <JobCard
                          job={job}
                          detailMode
                          onRefresh={handleRefresh}
                          onSuccess={(title, msg) => {
                            setSelectedId(null);
                            setSuccess({ title, message: msg });
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <button
                  disabled={page === 0}
                  onClick={() => { setPage(p => p - 1); setSelectedId(null); }}
                  className="flex items-center gap-1 text-xs text-secondary disabled:text-inactive disabled:cursor-not-allowed hover:text-text transition-colors"
                >
                  <FontAwesomeIcon icon="chevron-left" /> Prev
                </button>
                <div className="flex items-center gap-1 text-xs">
                  {getPageNumbers(page, totalPages).map((p, i) =>
                    p === '...'
                      ? <span key={`e${i}`} className="text-inactive px-1">...</span>
                      : (
                        <span key={p} className="flex items-center">
                          {i > 0 && typeof getPageNumbers(page, totalPages)[i - 1] === 'number' && (
                            <span className="text-border mx-0.5">|</span>
                          )}
                          <button
                            onClick={() => { setPage(p as number); setSelectedId(null); }}
                            className={`w-6 h-6 rounded transition-colors ${
                              p === page ? 'bg-highlight text-bg font-medium' : 'text-inactive hover:text-text'
                            }`}
                          >
                            {(p as number) + 1}
                          </button>
                        </span>
                      )
                  )}
                  <span className="text-inactive ml-1">of {totalPages}</span>
                </div>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => { setPage(p => p + 1); setSelectedId(null); }}
                  className="flex items-center gap-1 text-xs text-secondary disabled:text-inactive disabled:cursor-not-allowed hover:text-text transition-colors"
                >
                  Next <FontAwesomeIcon icon="chevron-right" />
                </button>
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:col-span-3">
            {!selectedJob ? (
              <Paper padded className="text-center border-dashed">
                <FontAwesomeIcon icon="briefcase" className="text-border text-3xl mb-3 block mx-auto" />
                <p className="text-inactive text-sm">Select a job to view details</p>
              </Paper>
            ) : (
              <div className="bg-paper border border-border rounded overflow-y-auto sticky top-[4.25rem] max-h-[calc(100vh-5.5rem)]">
                <JobCard
                  key={selectedJob.id}
                  job={selectedJob}
                  detailMode
                  onRefresh={handleRefresh}
                  onSuccess={(title, msg) => setSuccess({ title, message: msg })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
