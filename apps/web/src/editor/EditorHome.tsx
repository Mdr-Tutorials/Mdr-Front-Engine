import { useCallback, useEffect, useState } from 'react';
import { Plus, Box, Layers, Workflow, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './EditorHome.scss';
import { TIPS, type TipId } from './tips';
import NewResourceModal from './features/newfile/NewResourceModal';

// Mock Data Types
type ProjectType = 'project' | 'component' | 'nodegraph';

interface MockProject {
  id: string;
  type: ProjectType;
  name: string;
  description: string;
  updatedAt: number; // Timestamp
}

// 以下为 MockData
const MOCK_PROJECTS: MockProject[] = [
  {
    id: 'p1',
    type: 'project',
    name: 'SaaS Dashboard',
    description:
      'Main dashboard for the new SaaS platform including analytics and user management.',
    updatedAt: Date.now() - 1000 * 60 * 30, // 30 mins ago
  },
  {
    id: 'c1',
    type: 'component',
    name: 'UserCard',
    description: 'Reusable user profile card with avatar and status indicator. Long Long Long Long Long Long Long Long Long Long Long Long Long Long Description',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
  },
  {
    id: 'g1',
    type: 'nodegraph',
    name: 'Auth Flow',
    description: 'Login and registration authentication logic flow.',
    updatedAt: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
  },
  {
    id: 'p2',
    type: 'project',
    name: 'Landing Page',
    description: 'Marketing landing page with hero section and feature grid.',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
  },
  {
    id: 'p3',
    type: 'project',
    name: 'E-commerce Mobile',
    description: 'Mobile view for the shop, focusing on touch interactions.',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 10, // 10 days ago
  },
];

function EditorTipsRandom() {
  const { t } = useTranslation('editor');
  const tipsCount = TIPS.length;
  const [scores, setScores] = useState(() => Array(tipsCount).fill(1));
  const [active, setActive] = useState(0);

  const pickNextTip = useCallback(() => {
    const weights = scores.map((s) => 1 / s);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let next = 0;
    for (let i = 0; i < tipsCount; i++) {
      if (r < weights[i]) {
        next = i;
        break;
      }
      r -= weights[i];
    }
    if (next === active && tipsCount > 1) next = (active + 1) % tipsCount;
    setScores((prev) => {
      const clone = [...prev];
      clone[next] += 1;
      return clone;
    });
    setActive(next);
  }, [scores, active, tipsCount]);

  useEffect(() => {
    const timer = setInterval(pickNextTip, 5000);
    return () => clearInterval(timer);
  }, [pickNextTip]);

  const clickNext = () => pickNextTip();
  const tipId = TIPS[active] as TipId;

  return (
    <div className="EditorHomeSmallTip" onClick={clickNext}>
      <p>
        {t('tips.prefix')} {t(`tips.items.${tipId}.body`)}
      </p>
    </div>
  );
}

function ProjectCard({ project }: { project: MockProject }) {
  // const { t } = useTranslation('editor');

  const getIcon = (type: ProjectType) => {
    switch (type) {
      case 'project':
        return <Box size={24} />;
      case 'component':
        return <Layers size={24} />;
      case 'nodegraph':
        return <Workflow size={24} />;
      default:
        return <Box size={24} />;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <div className="ProjectCard">
      <div className="ProjectCardContent">
        <div style={{ color: 'var(--color-primary)', marginBottom: 8 }}>
          {getIcon(project.type)}
        </div>
        <h3 className="ProjectCardTitle">{project.name}</h3>
        <p className="ProjectCardDescription">
          {project.description || 'No description'}
        </p>
      </div>
      <div className="ProjectCardFooter">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} />
          <span className="ProjectCardTime">{formatTime(project.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function EditorHome() {
  const { t } = useTranslation('editor');
  const [isResourceModalOpen, setResourceModalOpen] = useState(false);

  // Sort projects: nearest updated first
  const sortedProjects = [...MOCK_PROJECTS].sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  return (
    <div className="EditorHome">
      <div className="EditorHomeMain">
        <header className="EditorHomeHeader">
          <h1>{t('home.welcomeTitle')}</h1>
        </header>

        <div className="EditorHomeGrid">
          {/* 1. New Resource Button (Create New) */}
          <button
            className="EditorHomeNewProjectButton"
            onClick={() => setResourceModalOpen(true)}
          >
            <Plus size={48} />
            <span className='EditorNewProject'>{t('home.actions.newProject')}</span>
          </button>

          {/* 2. Project List */}
          {sortedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        <div className="EditorHomeFooter">
          <EditorTipsRandom />
        </div>
      </div>

      <NewResourceModal
        open={isResourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
      />
    </div>
  );
}
export default EditorHome;
