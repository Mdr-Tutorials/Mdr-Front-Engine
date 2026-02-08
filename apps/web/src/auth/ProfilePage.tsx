import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
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
      <div className="min-h-screen bg-white text-[#101010]">
        <header className="flex items-center justify-between gap-4 bg-white px-5 py-4 md:px-7 md:py-[18px]">
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
        <main className="mx-auto grid max-w-[980px] gap-[18px] px-5 pb-10 md:px-7 md:pb-12">
          <div className="grid min-h-[calc(100vh-140px)] place-content-center gap-2.5 text-center text-[#2b2b2b]">
            <MdrIcon icon={<UserRound />} size={34} />
            <MdrHeading level={2} className="m-0 text-[88px]">
              {t('empty.title')}
            </MdrHeading>
            <MdrParagraph color="Muted">{t('empty.subtitle')}</MdrParagraph>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#101010]">
      <header className="flex items-center justify-between gap-4 bg-white px-5 py-4 md:px-7 md:py-[18px]">
        <MdrButton
          text={t('actions.backHome')}
          size="Small"
          category="Ghost"
          onClick={() => navigate('/')}
        />
        <div className="flex flex-wrap gap-2.5">
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

      <main className="mx-auto grid max-w-[980px] gap-[18px] px-5 pb-10 md:px-7 md:pb-12">
        {flash && (
          <div className="max-w-[620px]">
            <MdrMessage type={flash.type} text={flash.text} />
          </div>
        )}
        {error && (
          <div className="max-w-[620px]">
            <MdrMessage
              type="Danger"
              text={error}
              closable
              onClose={() => setError(null)}
            />
          </div>
        )}

        <section className="mt-2 grid items-start gap-[18px] md:grid-cols-[auto_1fr]">
          <div className="grid min-w-0 gap-2.5">
            <MdrHeading
              level={1}
              className="m-0 text-[56px] md:text-[96px] lg:text-[108px] [font-family:'JetBrains_Mono','SFMono-Regular','Menlo',monospace]"
            >
              {displayName}
            </MdrHeading>
            <MdrParagraph className="m-0 max-w-[58ch] text-[13px] leading-[1.5] text-[#2b2b2b]">
              {displayBio}
            </MdrParagraph>
            <button
              type="button"
              className="-translate-x-2.5 inline-flex max-w-full cursor-pointer items-center gap-3 rounded-2xl border-0 bg-(--color-0) px-3 py-2.5 transition-colors duration-150 hover:bg-black/[0.02]"
              onClick={() => copyText(user?.id, t('messages.copiedId'))}
              aria-label={t('actions.copyId')}
              title={t('actions.copyId')}
            >
              {uuidMatrix.length > 0 ? (
                <div className="flex flex-wrap items-start gap-1" aria-hidden="true">
                  {uuidMatrix.map((bits, columnIndex) => (
                    <div
                      key={`${columnIndex}-${bits.join('')}`}
                      className="grid gap-px"
                    >
                      {bits.map((bit, bitIndex) => (
                        <span
                          key={`${columnIndex}-${bitIndex}`}
                          className={`h-0.5 w-0.5 rounded-full ${bit ? 'bg-[#101010]' : 'invisible bg-black/12 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]'}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="[font-family:'JetBrains_Mono','SFMono-Regular','Menlo',monospace] text-xs tracking-[0.12em] break-all text-[#101010]">
                  {user?.id}
                </span>
              )}
              <span className="inline-flex opacity-60 transition-opacity hover:opacity-100">
                <MdrIcon icon={<Copy />} size={14} />
              </span>
            </button>
          </div>
        </section>

        <section className="mt-0.5 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border-0 bg-black/[0.04] px-3 py-2 text-xs text-[#101010] transition-colors duration-150 hover:bg-black/[0.06]"
            onClick={() => copyText(user?.email, t('messages.copiedEmail'))}
          >
            <MdrIcon icon={<Mail />} size={16} />
            <span>{user?.email}</span>
            <span className="ml-0.5 inline-flex opacity-60 transition-opacity hover:opacity-100">
              <MdrIcon icon={<Copy />} size={14} />
            </span>
          </button>
          <div className="inline-flex cursor-default items-center gap-2 rounded-full border-0 bg-black/[0.04] px-3 py-2 text-xs text-[#101010]">
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
          <div className="flex justify-end gap-2.5">
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
        <div className="grid gap-3.5">
          <label className="grid gap-1.5 text-xs text-[#5c5c5c]">
            <span>{t('labels.name')}</span>
            <MdrInput
              size="Small"
              value={draft.name}
              onChange={(value) => setDraft((p) => ({ ...p, name: value }))}
            />
          </label>
          <label className="grid gap-1.5 text-xs text-[#5c5c5c]">
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
