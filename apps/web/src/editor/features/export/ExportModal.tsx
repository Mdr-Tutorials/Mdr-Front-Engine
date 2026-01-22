// src/editor/features/export/ExportModal.tsx
import { useState, useEffect } from 'react';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { generateReactCode } from '@/mir/generator/mirToReact';
import { CodeViewer } from './CodeViewer';
import './ExportModal.scss'; // 👈 必须引入这个文件！
import { testDoc } from '@/mock/pagaData';

export const ExportModal = () => {
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
                    <h2>代码导出预览</h2>
                    <button className="close-btn" onClick={() => setExportModalOpen(false)}>✕</button>
                </div>

                <div className="export-modal-tabs">
                    <button className="tab-item active">REACT (TSX)</button>
                    <button className="tab-item">VUE (SFC)</button>
                </div>

                <div className="export-modal-content">
                    {/* 这里放置你的语法高亮组件 */}
                    <CodeViewer code={code} lang="typescript" />

                    <div className="code-footer">
                        <span>MdrFrontEngine Generator v1.0</span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(code);
                                alert('代码已复制');
                            }}
                            style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            复制代码
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};