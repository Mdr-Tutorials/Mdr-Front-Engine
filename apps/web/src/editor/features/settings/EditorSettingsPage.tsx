import { useNavigate } from 'react-router';
import { MdrButton, MdrHeading, MdrParagraph } from '@mdr/ui';
import { GlobalSettingsContent } from './GlobalSettingsContent';
import './SettingsPage.scss';

export const EditorSettingsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="SettingsPage">
            <header className="SettingsPageHeader">
                <div>
                    <MdrHeading level={2}>Editor Settings</MdrHeading>
                    <MdrParagraph size="Small" color="Muted">
                        Global defaults applied to every project and new workspace.
                    </MdrParagraph>
                </div>
                <div className="SettingsPageActions">
                    <MdrButton
                        text="Exit settings"
                        size="Small"
                        category="Secondary"
                        onClick={() => navigate('/editor')}
                    />
                </div>
            </header>
            <main className="SettingsPageBody">
                <GlobalSettingsContent mode="global" />
            </main>
        </div>
    );
};
