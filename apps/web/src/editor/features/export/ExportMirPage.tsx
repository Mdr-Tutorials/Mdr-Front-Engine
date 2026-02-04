import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { generateReactCode } from '@/mir/generator/mirToReact';
import { CodeViewer } from './CodeViewer';
import './ExportMirPage.scss';

type ExportTab = 'mir' | 'react';

export function ExportMirPage() {
  const { t } = useTranslation('export');
  const mirDoc = useEditorStore((state) => state.mirDoc);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<ExportTab>('mir');

  const mirJson = useMemo(() => {
    if (!mirDoc) return '';
    return JSON.stringify(mirDoc, null, 2);
  }, [mirDoc]);

  const reactCode = useMemo(() => {
    if (!mirDoc?.ui?.root) return '';
    try {
      return generateReactCode(mirDoc);
    } catch (error) {
      const message = t('react.error', { defaultValue: 'React 代码生成失败' });
      return `// ${message}\n${String(error)}`;
    }
  }, [mirDoc, t]);

  const activeCode = activeTab === 'mir' ? mirJson : reactCode;
  const activeTitle =
    activeTab === 'mir'
      ? t('mir.title', { defaultValue: 'MIR' })
      : t('react.title', { defaultValue: 'React' });
  const activeDescription =
    activeTab === 'mir'
      ? t('mir.description', { defaultValue: '当前项目的 MIR JSON（临时页）' })
      : t('react.description', {
          defaultValue: '基于当前 MIR 生成的 React 组件代码',
        });
  const activeEmpty =
    activeTab === 'mir'
      ? t('mir.empty', { defaultValue: '暂无 MIR（先进入蓝图编辑器创建组件）' })
      : t('react.empty', { defaultValue: '暂无 React 代码（先生成 MIR）' });

  useEffect(() => {
    setCopied(false);
  }, [activeTab]);

  return (
    <div className="ExportMirPage">
      <div className="ExportMirPageHeader">
        <div className="ExportMirPageTitle">
          <h1>{activeTitle}</h1>
          <p>{activeDescription}</p>
        </div>
        <div className="ExportMirPageActions">
          <div
            className="ExportMirPageTabs"
            role="tablist"
            aria-label={t('title', { defaultValue: '导出代码' })}
          >
            <button
              type="button"
              className={`ExportMirPageTab ${activeTab === 'mir' ? 'Active' : ''}`}
              onClick={() => setActiveTab('mir')}
              role="tab"
              aria-selected={activeTab === 'mir'}
            >
              {t('tabs.mir', { defaultValue: 'MIR' })}
            </button>
            <button
              type="button"
              className={`ExportMirPageTab ${activeTab === 'react' ? 'Active' : ''}`}
              onClick={() => setActiveTab('react')}
              role="tab"
              aria-selected={activeTab === 'react'}
            >
              {t('tabs.react', { defaultValue: 'React' })}
            </button>
          </div>
          <button
            type="button"
            className="ExportMirPageCopy"
            disabled={!activeCode}
            onClick={async () => {
              if (!activeCode) return;
              await navigator.clipboard.writeText(activeCode);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 900);
            }}
          >
            {copied
              ? t('copySuccess', { defaultValue: '已复制' })
              : t('copy', { defaultValue: '复制' })}
          </button>
        </div>
      </div>

      <div className="ExportMirPageBody">
        {activeCode ? (
          <CodeViewer
            code={activeCode}
            lang={activeTab === 'mir' ? 'json' : 'typescript'}
          />
        ) : (
          <div className="ExportMirPageEmpty">{activeEmpty}</div>
        )}
      </div>
    </div>
  );
}
