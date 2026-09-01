import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getJobs } from '../../services/job-services';
import type { Job } from '../../services/types';
import { formatDate } from '../../pages/utils/date';

const BADGE_CLASS: Record<string, string> = {
  INITIATED: 'badge badge-initiated',
  ASSIGNED:  'badge badge-assigned',
  ACTIVE:    'badge badge-active',
    IN_PROGRESS: 'badge badge-active',
  COMPLETED: 'badge badge-completed',
};

interface SkillJobsModalProps {
  skillName: string;
  onClose: () => void;
  onJobClick: (jobId: number) => void;
}

export default function SkillJobsModal({ skillName, onClose, onJobClick }: SkillJobsModalProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJobs(0, 200)
      .then(page => setJobs(page.content.filter(j =>
        j.requiredSkills?.some(s => s.toLowerCase() === skillName.toLowerCase())
      )))
      .finally(() => setLoading(false));
  }, [skillName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-paper border border-border rounded w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-xs text-inactive uppercase tracking-wider mb-0.5">Skill</p>
            <h3 className="font-display text-lg text-text flex items-center gap-2">
              <FontAwesomeIcon icon="screwdriver-wrench" className="text-highlight text-sm" />
              {skillName}
            </h3>
          </div>
          <button onClick={onClose} className="text-inactive hover:text-secondary transition-colors">
            <FontAwesomeIcon icon="xmark" />
          </button>
        </div>

        <div className="px-5 py-4 max-h-80 overflow-y-auto">
          {loading ? (
            <p className="text-inactive text-sm animate-pulse">Loading...</p>
          ) : jobs.length === 0 ? (
            <p className="text-inactive text-sm">No jobs currently require this skill.</p>
          ) : (
            <div className="space-y-2">
              {jobs.map(j => (
                <div
                  key={j.id}
                  onClick={() => { onJobClick(j.id); onClose(); }}
                  className="flex items-center gap-3 p-3 bg-bg rounded cursor-pointer hover:bg-border/30 transition-colors"
                >
                  <span className={`${BADGE_CLASS[j.status]} shrink-0`}>
                    {j.status}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text text-sm truncate">{j.name}</p>
                    <p className="text-inactive text-xs">
                      {formatDate(j.startDate)} – {formatDate(j.endDate)}
                      {j.city ? ` · ${j.city}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border">
          <p className="text-inactive text-xs">{jobs.length} job{jobs.length !== 1 ? 's' : ''} require this skill</p>
        </div>
      </div>
    </div>
  );
}
