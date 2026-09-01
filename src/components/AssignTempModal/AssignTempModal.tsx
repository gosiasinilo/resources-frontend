import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getAvailableTemps, assignTemp, recommendTemp } from '../../services/job-services';
import type { AvailableTemp, Job } from '../../services/types';
import { formatDate } from '../../pages/utils/date';

type SortOption = 'skills' | 'rating' | 'location' | 'all';

function initials(f: string, l: string) { return `${f[0]}${l[0]}`.toUpperCase(); }
function sameCity(a?: string | null, b?: string | null) {
  return !!(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
}

interface Props {
  job: Job;
  onClose: () => void;
  onAssigned: () => void;
}

interface Recommendation { tempId: number; firstName: string; lastName: string; reasoning: string }

export default function AssignTempModal({ job, onClose, onAssigned }: Props) {
  const [temps, setTemps]       = useState<AvailableTemp[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sort, setSort]         = useState<SortOption>('skills');
  const [assigning, setAssigning] = useState<number | null>(null);
  const [error, setError]       = useState<Record<number, string>>({});
  const [rec, setRec]           = useState<Recommendation | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState('');

  useEffect(() => {
    getAvailableTemps(job.id)
      .then(setTemps)
      .catch(() => setTemps([]))
      .finally(() => setLoading(false));
  }, [job.id]);

  const available   = temps.filter(t => t.available && t.id !== job.temp?.id);
  const unavailable = temps.filter(t => !t.available && t.id !== job.temp?.id);

  const sortFn = (a: AvailableTemp, b: AvailableTemp) => {
    if (sort === 'rating')   return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    if (sort === 'location') return (sameCity(a.city, job.city) ? 0 : 1) - (sameCity(b.city, job.city) ? 0 : 1);
    if (sort === 'all')      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    return b.matchingSkillCount - a.matchingSkillCount; // skills
  };

  const displayList: (AvailableTemp & { _unavailable?: boolean })[] =
    sort === 'all'
      ? [...available.slice().sort(sortFn), ...unavailable.slice().sort(sortFn).map(t => ({ ...t, _unavailable: true }))]
      : available.slice().sort(sortFn);

  const doAssign = async (temp: AvailableTemp) => {
    setAssigning(temp.id);
    setError({});
    try {
      await assignTemp(job.id, temp.id);
      onAssigned();
      onClose();
    } catch (err: any) {
      const d = err.data?.details;
      const msg = d ? (Object.values(d).flat() as string[])[0] : err.message || 'Assignment failed';
      setError(prev => ({ ...prev, [temp.id]: msg }));
    } finally { setAssigning(null); }
  };

  const doRecommend = async () => {
    setRecLoading(true);
    setRecError('');
    setRec(null);
    try {
      const r = await recommendTemp(job.id);
      setRec(r);
    } catch (err: any) {
      setRecError(err.data?.details?.api?.[0] || err.data?.details?.temps?.[0] || err.message || 'Recommendation failed');
    } finally { setRecLoading(false); }
  };

  const totalSkills = job.requiredSkills?.length ?? 0;

  const TempRow = ({ temp, unavailable: isUnavail }: { temp: AvailableTemp; unavailable?: boolean }) => {
    const recommended = rec?.tempId === temp.id;
    const cityMatch = sameCity(temp.city, job.city);
    return (
      <div key={temp.id} className={`flex items-center gap-3 rounded px-3 py-2.5 transition-colors ${
        recommended ? 'bg-highlight/10 border border-highlight/30' :
        isUnavail ? 'bg-bg/40 opacity-50' : 'bg-bg'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
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
          {error[temp.id] && <p className="text-orange-500 text-xs mt-1">{error[temp.id]}</p>}
        </div>
        {!isUnavail && (
          <button
            onClick={() => doAssign(temp)}
            disabled={assigning === temp.id}
            className="shrink-0 px-3 py-1.5 bg-highlight text-bg text-xs rounded-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {assigning === temp.id ? '...' : 'Assign'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-paper border border-border rounded w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">

        
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-xs text-inactive uppercase tracking-wider mb-0.5">Assign Temp</p>
            <h3 className="font-display text-lg text-text">{job.name}</h3>
            <p className="text-inactive text-xs mt-0.5">
              {formatDate(job.startDate)} – {formatDate(job.endDate)}
              {job.city ? ` · ${job.city}` : ' · Online'}
            </p>
          </div>
          <button onClick={onClose} className="text-inactive hover:text-secondary transition-colors mt-1">
            <FontAwesomeIcon icon="xmark" />
          </button>
        </div>

=        <div className="px-5 py-3 border-b border-border shrink-0 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-inactive">Sort:</span>
            {([
              { key: 'skills',   label: 'Skills' },
              { key: 'rating',   label: 'Rating' },
              ...(job.jobType === 'LOCATION' ? [{ key: 'location' as SortOption, label: 'Distance' }] : []),
              { key: 'all',      label: 'Show all' },
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
          <div className="px-5 pt-3 shrink-0">
            <p className="text-orange-400 text-xs bg-orange-950/30 border border-orange-900/40 rounded px-3 py-2">
              <FontAwesomeIcon icon="xmark" className="mr-1.5" />{recError}
            </p>
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {loading ? (
            <p className="text-inactive text-sm animate-pulse">Loading available temps...</p>
          ) : displayList.length === 0 ? (
            <p className="text-inactive text-sm">No temps available for these dates.</p>
          ) : (
            <div className="space-y-2">
              {rec && sort !== 'all' && (
                <>
                  {(() => {
                    const recTemp = available.find(t => t.id === rec.tempId);
                    if (!recTemp || displayList[0]?.id === rec.tempId) return null;
                    return (
                      <>
                        <p className="text-xs text-highlight uppercase tracking-wider pb-1">AI Recommendation</p>
                        <TempRow temp={recTemp} />
                        <p className="text-xs text-inactive uppercase tracking-wider pt-2 pb-1">All available</p>
                      </>
                    );
                  })()}
                </>
              )}
              {displayList.map(temp => (
                <TempRow key={temp.id} temp={temp} unavailable={(temp as any)._unavailable} />
              ))}
              {sort !== 'all' && unavailable.length > 0 && (
                <>
                  <p className="text-inactive text-xs pt-3 pb-1 uppercase tracking-wider">Unavailable</p>
                  {unavailable.map(temp => <TempRow key={temp.id} temp={temp} unavailable />)}
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border shrink-0 flex items-center justify-between">
          <p className="text-inactive text-xs">{available.length} available · {unavailable.length} unavailable</p>
          <button onClick={onClose} className="text-inactive hover:text-secondary text-xs transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}
