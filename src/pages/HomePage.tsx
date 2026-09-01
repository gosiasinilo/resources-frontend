import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Paper from '../components/Paper';

const FEATURES = [
  {
    icon: 'user-group'    as const,
    title: 'One temp per job',
    desc: 'A temp cannot be assigned to overlapping jobs — conflict detection is automatic.',
  },
  {
    icon: 'circle-check'  as const,
    title: 'Full job lifecycle',
    desc: 'Jobs move from Initiated → Assigned → Active → Completed, with an Overdue flag for jobs running past their end date.',
  },
  {
    icon: 'star'          as const,
    title: 'Review & rate',
    desc: 'Leave structured reviews after completion to build a reliable rating per temp.',
  },
  {
    icon: 'wand-magic-sparkles' as const,
    title: 'AI recommendations',
    desc: 'When assigning a temp, get an AI-powered suggestion based on skills, location, and availability.',
  },
];

export default function HomePage() {
  return (
    <div className="py-8 sm:py-14 max-w-3xl">
      <p className="text-inactive text-xs uppercase tracking-widest mb-4">
        Workforce Management
      </p>
      <h1 className="font-display text-4xl sm:text-5xl text-text leading-tight mb-5">
        Manage your<br />
        <span className="text-highlight">temporary workforce</span>
      </h1>
      <p className="text-secondary text-lg leading-relaxed mb-12 max-w-xl">
        Assign temporary workers to jobs, track availability across dates and locations, and review performance — all in one place.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map(({ icon, title, desc }) => (
          <Paper key={title} padded>
            <FontAwesomeIcon icon={icon} className="text-highlight text-lg mb-3 block" />
            <h3 className="font-display text-text text-base mb-1">{title}</h3>
            <p className="text-inactive text-sm leading-relaxed">{desc}</p>
          </Paper>
        ))}
      </div>
    </div>
  );
}
