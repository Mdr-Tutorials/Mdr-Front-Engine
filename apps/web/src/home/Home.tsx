import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Footprints, Github, Languages } from 'lucide-react';
import { MdrAvatar, MdrButtonLink, MdrLink, MdrNav } from '@mdr/ui';
import { IconMdr } from '../components/icons/IconMdr';
import { ExportModal } from '@/editor/features/export/ExportModal';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { useAuthStore } from '@/auth/useAuthStore';
import { generateReactCode } from '@/mir/generator/mirToReact';
import { MIRRenderer } from '@/mir/renderer/MIRRenderer';
import { testDoc } from '@/mock/pagaData';
import './Home.scss'

function Home() {
    const { t, i18n } = useTranslation('home');
    const [count, setCount] = useState(0);
    const { setGeneratedCode, setExportModalOpen } = useEditorStore();
    const user = useAuthStore((state) => state.user);
    const handleIncrement = () => setCount((prev) => prev + 1);
    const toggleLanguage = () => {
        const nextLanguage = i18n.language?.startsWith('zh') ? 'en' : 'zh-CN';
        i18n.changeLanguage(nextLanguage);
    };

    const handleQuickExport = () => {
        // 1. 生成代码（默认生成 React，弹窗内可以再切换）
        const code = generateReactCode(testDoc);
        // 2. 存入 Store
        setGeneratedCode(code);
        // 3. 打开弹窗
        setExportModalOpen(true);
    };

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
        <div className="home">
            <MdrNav className='nav'>
                <MdrNav.Left>
                    <IconMdr size={30} color="black" />
                    <MdrNav.Heading heading={t('brand.name')} />
                </MdrNav.Left>
                <MdrNav.Right>
                    <p>{t('nav.community')}</p>
                    <p>{t('nav.tutorials')}</p>
                    <p>{t('nav.docs')}</p>
                    <a
                        className="HomeNavIcon"
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
                        className="HomeNavIcon"
                        onClick={toggleLanguage}
                        aria-label={t('nav.languageSwitch')}
                        title={t('nav.languageSwitch')}
                    >
                        <Languages size={18} />
                    </button>
                    {user ? (
                        <MdrLink to="/profile" className="HomeProfileLink">
                            <MdrAvatar size="Small" initials={initials} />
                        </MdrLink>
                    ) : (
                        <MdrButtonLink text={t('nav.signIn')} size="Small" category="Ghost" to="/auth" />
                    )}
                </MdrNav.Right>
            </MdrNav>
            <div className="content">
                <div className="titles">
                    <h1 className="">
                        {t('hero.line1.before')} <span>{t('hero.line1.highlight')}</span>
                    </h1>
                    <h1 className="">
                        {t('hero.line2.before')} <span>{t('hero.line2.highlight')}</span>
                    </h1>
                    <h1>{t('hero.line3.before')} <span>{t('hero.line3.highlight')}</span></h1>
                </div>
                <h2>{t('hero.subtitle')}</h2>
                <div className="button-bar">
                    <MdrButtonLink text={t('actions.enterEditor')} size='Big' category='Primary' to={"/editor"} />
                    <MdrButtonLink text={t('actions.viewDocs')} size='Big' category='Secondary' to={"http://localhost:5174"} />
                </div>

                <section className="divider">
                    <h2>{t('mirTest.title')}</h2>

                    <MIRRenderer
                        node={testDoc.ui.root}
                        mirDoc={testDoc}
                        overrides={{
                            count,
                            onAction: handleIncrement
                        }}
                    />
                    <button
                        onClick={handleQuickExport}
                        className="export-button"
                    >
                        <Download size={16} />
                        <span>{t('mirTest.exportButton')}</span>
                    </button>
                </section>
            </div>

            <ExportModal />

            <footer className='footer'>
                <div className="footer-left">
                    <IconMdr size={16} color="black" />
                    <span>{t('footer.copy')}</span>
                </div>
                <div className="footer-right">
                    <Footprints size={16} />
                    <span>{t('footer.placeholder')}</span>
                </div>
            </footer>
        </div>
    );
}

export default Home;
