// src/editor/features/export/ExportModal.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { generateReactCode } from '@/mir/generator/mirToReact';
import { CodeViewer } from './CodeViewer';
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
    <div className="fixed inset-0 z-9999 flex h-screen w-screen items-center justify-center bg-[rgba(0,0,0,0.7)] backdrop-blur-xs">
      <div className="flex h-[80vh] w-[85vw] flex-col overflow-hidden rounded-xl border border-[#333] bg-[#1e1e1e] text-white shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-[#333] bg-[#252526] px-6 py-4">
          <h2 className="m-0 text-[1.1rem] font-medium text-[#ccc]">
            {t('title')}
          </h2>
          <button
            className="cursor-pointer border-0 bg-transparent text-[20px] text-[#888] hover:text-white"
            onClick={() => setExportModalOpen(false)}
            aria-label={t('close')}
          >
            ✕
          </button>
        </div>

        <div className="flex bg-[#2d2d2d] px-2.5">
          <button className="cursor-pointer border-0 border-b-2 border-b-[#3b82f6] bg-[#1e1e1e] px-5 py-2.5 text-[13px] text-[#3b82f6]">
            {t('tabs.react')}
          </button>
          <button className="cursor-pointer border-0 border-b-2 border-b-transparent bg-transparent px-5 py-2.5 text-[13px] text-[#aaa]">
            {t('tabs.vue')}
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden p-5">
          {/* 这里放置你的语法高亮组件 */}
          <CodeViewer code={code} lang="typescript" />

          <div className="mt-3 flex justify-between text-[12px] text-[#666]">
            <span>{t('footer.generator')}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(code);
                alert(t('copySuccess'));
              }}
              className="cursor-pointer border-0 bg-transparent text-[#3b82f6]"
            >
              {t('copy')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
