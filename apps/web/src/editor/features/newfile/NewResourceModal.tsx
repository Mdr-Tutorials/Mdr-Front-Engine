import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MdrButton, MdrInput, MdrTextarea } from '@mdr/ui';
import { Box, Layers, Workflow } from 'lucide-react';
import { useEditorStore } from '@/editor/store/useEditorStore';
import './NewResourceModal.scss';

export type ResourceType = 'project' | 'component' | 'nodegraph';

interface NewResourceModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: ResourceType;
}

const createId = (type: ResourceType) => {
  const prefixMap = {
    project: 'proj',
    component: 'cmp',
    nodegraph: 'graph',
  };
  const prefix = prefixMap[type];

  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

function NewResourceModal({
  open,
  onClose,
  defaultType = 'project',
}: NewResourceModalProps) {
  const { t } = useTranslation('editor');
  const navigate = useNavigate();
  const setProject = useEditorStore((state) => state.setProject);

  // State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [type, setType] = useState<ResourceType>(defaultType);

  if (!open) return null;

  const handleCreate = () => {
    const finalName = name.trim() || 'Untitled';
    const id = createId(type);

    if (type === 'project') {
      // Original NewProjectModal setProject logicdescription
      setProject({ id, name: finalName, description: '' });
      onClose();
      navigate(`/editor/project/${id}/blueprint`);
    } else if (type === 'component') {
      onClose();
      navigate(`/editor/project/${id}/component`);
    } else if (type === 'nodegraph') {
      onClose();
      navigate(`/editor/project/${id}/nodegraph`);
    }
  };

  return (
    <div className="NewResourceModalOverlay" onClick={onClose}>
      <div
        className="NewResourceModalContainer"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="NewResourceModalHeader">
          <div>
            <h2>{t('modals.newResource.title', 'Create New')}</h2>
            <p>
              {t(
                'modals.newResource.subtitle',
                'Select a type and start building'
              )}
            </p>
          </div>
          <button
            className="NewResourceModalClose"
            onClick={onClose}
            aria-label={t('modals.close')}
          >
            ✕
          </button>
        </header>

        <div className="NewResourceModalBody">
          <div className="NewResourceModalField">
            <label className="NewResourceModalLabel">
              {t('modals.newResource.typeLabel', 'Type')}
            </label>
            <div className="NewResourceModalTypeGroup">
              <button
                type="button"
                className={`NewResourceModalTypeItem ${type === 'project' ? 'Active' : ''}`}
                onClick={() => setType('project')}
              >
                <Box size={24} />
                <span>
                  {t('modals.newProject.title', 'Project')
                    .replace('Create ', '')
                    .replace('新建', '')}
                </span>
              </button>
              <button
                type="button"
                className={`NewResourceModalTypeItem ${type === 'component' ? 'Active' : ''}`}
                onClick={() => setType('component')}
              >
                <Layers size={24} />
                <span>
                  {t('modals.newComponent.title', 'Component')
                    .replace('Create ', '')
                    .replace('新建', '')}
                </span>
              </button>
              <button
                type="button"
                className={`NewResourceModalTypeItem ${type === 'nodegraph' ? 'Active' : ''}`}
                onClick={() => setType('nodegraph')}
              >
                <Workflow size={24} />
                <span>
                  {t('modals.newNodeGraph.title', 'Node Graph')
                    .replace('Create ', '')
                    .replace('新建', '')}
                </span>
              </button>
            </div>
          </div>

          <div className="NewResourceModalField">
            <label
              className="NewResourceModalLabel"
              htmlFor="new-resource-name"
            >
              <span>{t('modals.newResource.nameLabel', 'Name')}</span>
            </label>
            <MdrInput
              id="new-resource-name"
              placeholder="Untitled"
              value={name}
              onChange={setName}
            />
          </div>

          <div className="NewResourceModalField">
            <label className="NewResourceModalLabel">
                {t('modals.newProject.descriptionLabel', 'Description')}
            </label>
            <MdrTextarea 
                placeholder={t('modals.newProject.descriptionPlaceholder', 'Optional description')} 
                value={description} 
                onChange={setDescription} 
            />
          </div>
        </div>

        <footer className="NewResourceModalFooter">
          <MdrButton
            text={t('modals.actions.cancel')}
            category="Ghost"
            onClick={onClose}
          />
          <MdrButton
            text={t('modals.actions.create', 'Create')}
            category="Primary"
            onClick={handleCreate}
          />
        </footer>
      </div>
    </div>
  );
}

export default NewResourceModal;
