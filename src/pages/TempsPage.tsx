import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getTemps, getTempById, deleteTemp } from '../services/temp-services';
import type { Temp, TempDetail } from '../services/types';
import TempCard, { TempDetailContent } from '../components/TempCard/TempCard';
import Paper from '../components/Paper';
import ConfirmModal from '../components/ConfirmModal/ConfirmModal';
import SkillJobsModal from '../components/SkillJobsModal/SkillJobsModal';
import SuccessBanner from '../components/SuccessBanner/SuccessBanner';

const PAGE_SIZE = 10;

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages: (number | '...')[] = [0];
  if (current > 2) pages.push('...');
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) pages.push(i);
  if (current < total - 3) pages.push('...');
  pages.push(total - 1);
  return pages;
}

type SuccessState = { title: string; message: string } | null;

export default function TempsPage() {
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get('selected') ? Number(searchParams.get('selected')) : null;
  const navigate = useNavigate();

  type TempSort = 'az' | 'za' | 'rating-asc' | 'rating-desc' | 'jobs-asc' | 'jobs-desc' | 'location';

  const [temps, setTemps]             = useState<Temp[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [sort, setSort]               = useState<TempSort>('az');
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [selectedId, setSelectedId]   = useState<number | null>(preSelectedId);
  const [detail, setDetail]           = useState<TempDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [success, setSuccess]         = useState<SuccessState>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [skillModal, setSkillModal]   = useState<string | null>(null);

  const load = useCallback(async (p = page) => {
    try {
      const res = await getTemps(p, PAGE_SIZE);
      setTemps(res.content);
      setTotalPages(res.totalPages);
    } finally { setLoading(false); }
  }, [page]);

  const refreshDetail = useCallback(async () => {
    if (!selectedId) return;
    const d = await getTempById(selectedId);
    setDetail(d);
  }, [selectedId]);

  const refreshAll = useCallback(async () => {
    await load(page);
    await refreshDetail();
  }, [load, page, refreshDetail]);

  useEffect(() => { load(page); }, [page]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    setDetailLoading(true);
    getTempById(selectedId)
      .then(setDetail)
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  useEffect(() => {
    if (preSelectedId) setSelectedId(preSelectedId);
  }, [preSelectedId]);

  const handleSelect = (id: number) => {
    setSelectedId(selectedId === id ? null : id);
  };

  const handleDelete = async () => {
    if (!detail) return;
    setShowConfirm(false);
    try {
      await deleteTemp(detail.id);
      setSelectedId(null);
      setDetail(null);
      await load(page);
      setSuccess({ title: 'Temp deleted', message: `${detail.firstName} ${detail.lastName} has been removed.` });
    } catch { /**/ }
  };

  const filtered = temps
    .filter(t => !search || `${t.firstName} ${t.lastName} ${t.city} ${t.email}`
      .toLowerCase().includes(search.toLowerCase()))
    .slice()
    .sort((a, b) => {
      if (sort === 'za')          return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
      if (sort === 'rating-desc') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (sort === 'rating-asc')  return (Number(a.rating) || 0) - (Number(b.rating) || 0);
      if (sort === 'jobs-desc')   return (b.jobCount ?? 0) - (a.jobCount ?? 0);
      if (sort === 'jobs-asc')    return (a.jobCount ?? 0) - (b.jobCount ?? 0);
      if (sort === 'location') {
        const ca = a.city ?? '', cb = b.city ?? '';
        if (!ca && !cb) return 0;
        if (!ca) return 1;
        if (!cb) return -1;
        return ca.localeCompare(cb);
      }
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });

  if (loading) return <p className="text-secondary text-sm py-8 animate-pulse">Loading temps...</p>;

  return (
    <>
      {success && (
        <SuccessBanner
          title={success.title}
          message={success.message}
          onContinue={() => setSuccess(null)}
        />
      )}

      {showConfirm && detail && (
        <ConfirmModal
          message={`Delete ${detail.firstName} ${detail.lastName}?`}
          subMessage="They will be unassigned from all jobs."
          confirmLabel="Delete temp"
          onConfirm={handleDelete}
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

      <div>
        <div className="mb-6">
          <p className="text-inactive text-xs uppercase tracking-wider mb-1">Directory</p>
          <h1 className="font-display text-3xl text-text flex items-center gap-3">
            <FontAwesomeIcon icon="user-group" className="text-highlight text-2xl" />Temps
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2">
            <div className="relative mb-2">
              <FontAwesomeIcon icon="magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-inactive text-xs" />
              <input className="input pl-8 w-full" placeholder="Search by name, city or email..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              <span className="text-xs text-inactive">Sort:</span>
              {([
                { key: 'az',          label: 'A→Z' },
                { key: 'za',          label: 'Z→A' },
                { key: 'rating-desc', label: '★↑' },
                { key: 'rating-asc',  label: '★↓' },
                { key: 'jobs-desc',   label: 'Jobs↑' },
                { key: 'jobs-asc',    label: 'Jobs↓' },
                { key: 'location',    label: 'Location' },
              ] as { key: TempSort; label: string }[]).map(({ key, label }) => (
                <button key={key} onClick={() => setSort(key)}
                  className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                    sort === key ? 'bg-toplayer border-toplayer text-text' : 'border-border text-inactive hover:border-secondary'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {filtered.length === 0
              ? <p className="text-inactive text-sm py-4">No temps found.</p>
              : (
                <div className="space-y-2">
                  {filtered.map(t => (
                    <TempCard
                      key={t.id}
                      temp={t}
                      detail={selectedId === t.id ? detail : null}
                      isSelected={selectedId === t.id}
                      onSelect={() => handleSelect(t.id)}
                      onRefresh={refreshAll}
                      onSuccess={(title, msg) => {
                        setSelectedId(null);
                        setSuccess({ title, message: msg });
                      }}
                    />
                  ))}
                </div>
              )
            }

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
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
                            onClick={() => setPage(p as number)}
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
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1 text-xs text-secondary disabled:text-inactive disabled:cursor-not-allowed hover:text-text transition-colors"
                >
                  Next <FontAwesomeIcon icon="chevron-right" />
                </button>
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:col-span-3">
            {detailLoading && (
              <Paper padded><p className="text-secondary text-sm animate-pulse">Loading...</p></Paper>
            )}

            {!detailLoading && !detail && (
              <Paper padded className="text-center border-dashed">
                <FontAwesomeIcon icon="user-group" className="text-border text-3xl mb-3 block mx-auto" />
                <p className="text-inactive text-sm">Select a temp to view their profile</p>
              </Paper>
            )}

            {!detailLoading && detail && (
              <Paper className="overflow-hidden sticky top-20">
                <TempDetailContent
                  detail={detail}
                  onAssignJob={() => navigate(`/temps/${detail.id}/assign`)}
                  onDelete={() => setShowConfirm(true)}
                  onSkillClick={setSkillModal}
                  onJobClick={jobId => navigate(`/jobs?selected=${jobId}`)}
                  onRefresh={refreshAll}
                  onSuccess={(title, msg) => setSuccess({ title, message: msg })}
                />
              </Paper>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
