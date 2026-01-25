// src/editor/features/export/ExportModal.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { generateReactCode } from '@/mir/generator/mirToReact';
import { CodeViewer } from './CodeViewer';
import './ExportModal.scss'; // 👈 必须引入这个文件！
import { testDoc } from '@/mock/pagaData';

export const ExportModal = () => {
    const { t } = useTranslation('export');
    const { isExportModalOpen, setExportModalOpen } = useEditorStore();
    const [code, setCode] = useState('');

    useEffect(() => {
        if (isExportModalOpen) {
            // 调用我们刚写好的渲染器
            const generated = generateReactCode(testDoc);
            setCode(generated);
        }
    }, [testDoc, isExportModalOpen]);

    if (!isExportModalOpen) return null;

    return (
        <div className="export-modal-overlay">
            <div className="export-modal-container">

                <div className="export-modal-header">
                    <h2>{t('title')}</h2>
                    <button className="close-btn" onClick={() => setExportModalOpen(false)} aria-label={t('close')}>✕</button>
                </div>

                <div className="export-modal-tabs">
                    <button className="tab-item active">{t('tabs.react')}</button>
                    <button className="tab-item">{t('tabs.vue')}</button>
                </div>

                <div className="export-modal-content">
                    {/* 这里放置你的语法高亮组件 */}
                    <CodeViewer code={code} lang="typescript" />

                    <div className="code-footer">
                        <span>{t('footer.generator')}</span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(code);
                                alert(t('copySuccess'));
                            }}
                            style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            {t('copy')}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
