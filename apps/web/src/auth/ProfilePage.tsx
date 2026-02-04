import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  MdrAvatar,
  MdrButton,
  MdrHeading,
  MdrIcon,
  MdrInput,
  MdrMessage,
  MdrModal,
  MdrParagraph,
  MdrTextarea,
} from '@mdr/ui';
import { Calendar, Copy, Mail, Pencil, UserRound } from 'lucide-react';
import { authApi, ApiError } from './authApi';
import { useAuthStore } from './useAuthStore';
import './ProfilePage.scss';

type Flash = { type: 'Info' | 'Success' | 'Warning' | 'Danger'; text: string };

const formatError = (error: unknown) => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
};

const formatDate = (value?: string | null) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const hexToBits = (value: string) => {
  const parsed = Number.parseInt(value, 16);
  if (Number.isNaN(parsed)) return [0, 0, 0, 0];
  return [8, 4, 2, 1].map((bit) => (parsed & bit ? 1 : 0));
};

const buildUuidMatrix = (value?: string | null) => {
  if (!value) return [];
  const clean = value.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
  return clean.split('').map((char) => hexToBits(char));
};

const getInitials = (name?: string | null, email?: string | null) => {
  const safeName = name?.trim();
  if (safeName) {
    const parts = safeName.split(/\s+/).filter(Boolean);
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
  const safeEmail = email?.trim();
  if (safeEmail) return safeEmail.charAt(0).toUpperCase();
  return undefined;
};

export const ProfilePage = () => {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const { token, user, setUser, clearSession } = useAuthStore();

  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const flashTimer = useRef<number | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', description: '' });

  const uuidMatrix = useMemo(() => buildUuidMatrix(user?.id), [user?.id]);
  const initials = useMemo(
    () => getInitials(user?.name, user?.email),
    [user?.name, user?.email]
  );
  const displayName = user?.name?.trim() || user?.email || t('empty.title');
  const displayBio = user?.description?.trim() || t('description.empty');

  const showFlash = useCallback((next: Flash) => {
    setFlash(next);
    if (typeof window === 'undefined') return;
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => {
      setFlash(null);
      flashTimer.current = null;
    }, 1800);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return;
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.me(token);
      setUser(response.user);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }, [token, setUser]);

  useEffect(() => {
    if (!token || user) return;
    fetchProfile();
  }, [token, user, fetchProfile]);

  const copyText = useCallback(
    async (value: string | undefined, message: string) => {
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        showFlash({ type: 'Success', text: message });
      } catch {
        showFlash({ type: 'Warning', text: t('messages.copyFailed') });
      }
    },
    [showFlash, t]
  );

  const openEdit = () => {
    setError(null);
    setDraft({
      name: user?.name ?? '',
      description: user?.description ?? '',
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.updateProfile(token, {
        name: draft.name.trim(),
        description: draft.description.trim(),
      });
      setUser(response.user);
      setEditOpen(false);
      showFlash({ type: 'Success', text: t('messages.saved') });
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="ProfilePage">
        <header className="ProfileTopBar">
          <MdrButton
            text={t('actions.backHome')}
            size="Small"
            category="Ghost"
            onClick={() => navigate('/')}
          />
          <MdrButton
            text={t('actions.login')}
            size="Small"
            category="Primary"
            onClick={() => navigate('/auth')}
          />
        </header>
        <main className="ProfileMain">
          <div className="ProfileEmpty">
            <MdrIcon icon={<UserRound />} size={34} />
            <MdrHeading level={2}>{t('empty.title')}</MdrHeading>
            <MdrParagraph color="Muted">{t('empty.subtitle')}</MdrParagraph>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ProfilePage">
      <header className="ProfileTopBar">
        <MdrButton
          text={t('actions.backHome')}
          size="Small"
          category="Ghost"
          onClick={() => navigate('/')}
        />
        <div className="ProfileTopBarActions">
          <MdrButton
            text={t('actions.edit')}
            size="Small"
            category="Secondary"
            iconPosition="Left"
            icon={<Pencil size={16} />}
            disabled={isLoading}
            onClick={openEdit}
          />
          <MdrButton
            text={t('actions.logout')}
            size="Small"
            category="Primary"
            disabled={isLoading}
            onClick={async () => {
              if (token) {
                try {
                  await authApi.logout(token);
                } catch (err) {
                  setError(formatError(err));
                }
              }
              clearSession();
              navigate('/auth');
            }}
          />
        </div>
      </header>

      <main className="ProfileMain">
        {flash && (
          <div className="ProfileFlash">
            <MdrMessage type={flash.type} text={flash.text} />
          </div>
        )}
        {error && (
          <div className="ProfileFlash">
            <MdrMessage
              type="Danger"
              text={error}
              closable
              onClose={() => setError(null)}
            />
          </div>
        )}

        <section className="ProfileHero">
          {/* <div className="ProfileHeroAvatar">
            <MdrAvatar size="ExtraLarge" initials={initials} alt={displayName} />
          </div> */}
          <div className="ProfileHeroBody">
            <MdrHeading level={1} className="ProfileName">
              {displayName}
            </MdrHeading>
            <MdrParagraph className="ProfileBio">{displayBio}</MdrParagraph>
            <button
              type="button"
              className="ProfileFingerprint"
              onClick={() => copyText(user?.id, t('messages.copiedId'))}
              aria-label={t('actions.copyId')}
              title={t('actions.copyId')}
            >
              {uuidMatrix.length > 0 ? (
                <div className="ProfileUuidGrid" aria-hidden="true">
                  {uuidMatrix.map((bits, columnIndex) => (
                    <div
                      key={`${columnIndex}-${bits.join('')}`}
                      className="ProfileUuidColumn"
                    >
                      {bits.map((bit, bitIndex) => (
                        <span
                          key={`${columnIndex}-${bitIndex}`}
                          className={`UuidDot ${bit ? 'Active' : 'Empty'}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="ProfileFallbackId">{user?.id}</span>
              )}
              <span className="ProfileFingerprintHint">
                <MdrIcon icon={<Copy />} size={14} />
              </span>
            </button>
          </div>
        </section>

        <section className="ProfileMeta">
          <button
            type="button"
            className="ProfileMetaItem"
            onClick={() => copyText(user?.email, t('messages.copiedEmail'))}
          >
            <MdrIcon icon={<Mail />} size={16} />
            <span>{user?.email}</span>
            <span className="ProfileMetaHint">
              <MdrIcon icon={<Copy />} size={14} />
            </span>
          </button>
          <div className="ProfileMetaItem Static">
            <MdrIcon icon={<Calendar />} size={16} />
            <span>{formatDate(user?.createdAt)}</span>
          </div>
        </section>
      </main>

      <MdrModal
        open={editOpen}
        title={t('edit.title')}
        onClose={() => setEditOpen(false)}
        closeOnOverlayClick={!isLoading}
        footer={
          <div className="ProfileEditFooter">
            <MdrButton
              text={t('actions.cancel')}
              size="Small"
              category="Secondary"
              disabled={isLoading}
              onClick={() => setEditOpen(false)}
            />
            <MdrButton
              text={t('actions.save')}
              size="Small"
              category="Primary"
              disabled={isLoading || !draft.name.trim()}
              onClick={saveEdit}
            />
          </div>
        }
      >
        {error && (
          <MdrMessage
            type="Danger"
            text={error}
            closable
            onClose={() => setError(null)}
          />
        )}
        <div className="ProfileEditForm">
          <label className="ProfileEditField">
            <span>{t('labels.name')}</span>
            <MdrInput
              size="Small"
              value={draft.name}
              onChange={(value) => setDraft((p) => ({ ...p, name: value }))}
            />
          </label>
          <label className="ProfileEditField">
            <span>{t('labels.description')}</span>
            <MdrTextarea
              size="Small"
              rows={3}
              value={draft.description}
              onChange={(value) =>
                setDraft((p) => ({ ...p, description: value }))
              }
            />
          </label>
        </div>
      </MdrModal>
    </div>
  );
};
