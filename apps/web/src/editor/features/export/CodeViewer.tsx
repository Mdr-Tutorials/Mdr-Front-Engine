// src/editor/features/export/CodeViewer.tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// 引入 VS Code 暗色风格主题
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewerProps {
  code: string; // 要显示的代码字符串
  lang?: string; // 语言类型，比如 'typescript', 'javascript', 'html'
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  lang = 'typescript',
}) => {
  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        borderRadius: '8px',
        fontSize: '14px',
        lineHeight: '1.5',
      }}
    >
      <SyntaxHighlighter
        language={lang}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '20px',
          height: '100%',
          backgroundColor: '#1e1e1e', // 匹配 VS Code 底色
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};
