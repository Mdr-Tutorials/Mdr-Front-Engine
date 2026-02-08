import { useTranslation } from 'react-i18next';
import { Footprints, Github, Languages, Moon, Sun } from 'lucide-react';
import { MdrAvatar, MdrButtonLink, MdrLink, MdrNav } from '@mdr/ui';
import { IconMdr } from '@/components/icons/IconMdr';
import { useSettingsStore } from '@/editor/store/useSettingsStore';
import { useAuthStore } from '@/auth/useAuthStore';

function Home() {
  const { t, i18n } = useTranslation('home');

  // Theme is now managed by Policy/GlobalStore
  const themeMode = useSettingsStore((state) => state.global.theme);
  const setGlobalValue = useSettingsStore((state) => state.setGlobalValue);

  const user = useAuthStore((state) => state.user);
  const toggleLanguage = () => {
    const nextLanguage = i18n.language?.startsWith('zh') ? 'en' : 'zh-CN';
    i18n.changeLanguage(nextLanguage);
    setGlobalValue('language', nextLanguage);
  };
  const toggleTheme = () => {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
    setGlobalValue('theme', nextTheme); // ThemeSync will handle DOM update
  };
  const logoColor = themeMode === 'dark' ? 'white' : 'black';
  const secondaryHeadingClassName =
    'mt-[15px] text-[20px] font-normal text-[var(--color-6)]';
  const navIconClassName =
    'inline-flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-[var(--color-7)] no-underline transition-colors duration-200 ease-[ease] hover:bg-[var(--color-1)] hover:text-[var(--color-10)]';
  const profileLinkClassName =
    'inline-flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[var(--color-1)] no-underline transition-[box-shadow,transform] duration-200 ease-[ease] hover:-translate-y-px hover:shadow-[0_10px_18px_rgba(0,0,0,0.12)]';

  const initials =
    user?.name
      ?.split(' ')
      .map((item) => item.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    undefined;

  return (
    <div className="mx-auto flex min-h-screen w-[calc(100vw-80px)] flex-col items-center justify-start">
      <MdrNav>
        <MdrNav.Left>
          <IconMdr size={30} color={logoColor} />
          <MdrNav.Heading heading={t('brand.name')} />
        </MdrNav.Left>
        <MdrNav.Right>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-8 pr-4">
              <MdrLink to="/community">{t('nav.community')}</MdrLink>
              <MdrLink to="http://localhost:5174/guide/getting-started">
                {t('nav.tutorials')}
              </MdrLink>
              <MdrLink to="http://localhost:5174/guide/introduction">
                {t('nav.docs')}
              </MdrLink>
            </div>
            <a
              className={navIconClassName}
              href="https://github.com/Mdr-Tutorials/Mdr-Front-Engine"
              target="_blank"
              rel="noreferrer"
              aria-label={t('nav.github')}
              title={t('nav.github')}
            >
              <Github size={18} />
            </a>
            <button
              type="button"
              className={navIconClassName}
              onClick={toggleLanguage}
              aria-label={t('nav.languageSwitch')}
              title={t('nav.languageSwitch')}
            >
              <Languages size={18} />
            </button>
            <button
              type="button"
              className={navIconClassName}
              onClick={toggleTheme}
              aria-label={
                themeMode === 'dark' ? '切换到浅色主题' : '切换到深色主题'
              }
              title={themeMode === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
            >
              {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <MdrLink to="/profile" className={profileLinkClassName}>
                <MdrAvatar size="Small" initials={initials} />
              </MdrLink>
            ) : (
              <MdrButtonLink
                text={t('nav.signIn')}
                size="Small"
                category="Ghost"
                to="/auth"
              />
            )}
          </div>
        </MdrNav.Right>
      </MdrNav>
      <div className="w-[85vw] flex-1">
        <div className="mt-25 flex flex-col text-(--color-9)">
          <h1 className="text-[64px] font-medium">
            <span className="font-extrabold text-(--color-10) underline decoration-wavy decoration-4 underline-offset-[7px]">
              {t('hero.line1.highlight')}
            </span>
          </h1>
          <h1 className="text-[64px] font-medium">
            {t('hero.line2.before')}{' '}
            <span className="font-extrabold text-(--color-10) underline decoration-wavy decoration-4 underline-offset-[7px]">
              {t('hero.line2.highlight')}
            </span>
          </h1>
          <h1 className="text-[64px] font-medium">
            {t('hero.line3.before')}{' '}
            <span className="font-extrabold text-(--color-10) underline decoration-wavy decoration-4 underline-offset-[7px]">
              {t('hero.line3.highlight')}
            </span>
          </h1>
        </div>
        <h2 className={secondaryHeadingClassName}>{t('hero.subtitle')}</h2>
        <div className="mt-20 flex flex-row gap-6">
          <MdrButtonLink
            text={t('actions.enterEditor')}
            size="Big"
            category="Primary"
            to="/editor"
          />
          <MdrButtonLink
            text={t('actions.viewDocs')}
            size="Big"
            category="Secondary"
            to="http://localhost:5174"
          />
        </div>
      </div>

      <footer className="mt-auto flex w-full flex-row items-center justify-between px-10 py-4">
        <div className="flex items-center gap-2 text-[1em] text-(--color-7)">
          <IconMdr size={16} color={logoColor} />
          <span>{t('footer.copy')}</span>
        </div>
        <div className="flex items-center gap-2 text-[1em] text-(--color-7)">
          <Footprints size={16} />
          <span>{t('footer.placeholder')}</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
