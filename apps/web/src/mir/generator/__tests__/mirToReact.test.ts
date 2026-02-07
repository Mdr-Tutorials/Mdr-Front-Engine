import { describe, expect, it } from 'vitest';
import { generateReactBundle, generateReactCode } from '../mirToReact';
import type { MIRDocument } from '@/core/types/engine.types';

const createDoc = (): MIRDocument => ({
  version: '1.0',
  metadata: { name: 'Demo' },
  ui: {
    root: {
      id: 'root',
      type: 'MdrButton',
      text: 'Open',
      events: {
        click: {
          trigger: 'onClick',
          action: 'navigate',
          params: { to: 'https://example.com', target: '_blank' },
        },
      },
    },
  },
});

describe('mirToReact generator', () => {
  it('inlines built-in handlers into JSX attributes', () => {
    const code = generateReactCode(createDoc(), { resourceType: 'component' });
    expect(code).toContain('onClick={() => {');
    expect(code).toContain(
      `window.open("https://example.com", '_blank', 'noopener,noreferrer');`
    );
    expect(code).not.toContain('runNavigate');
  });

  it('omits props interface when MIR has no props', () => {
    const code = generateReactCode(createDoc(), { resourceType: 'component' });
    expect(code).not.toContain('interface DemoProps');
    expect(code).toContain('export default function Demo()');
  });

  it('emits full project bundle for project resource type', () => {
    const bundle = generateReactBundle(createDoc(), { resourceType: 'project' });
    const paths = bundle.files.map((item) => item.path);
    expect(paths).toContain('package.json');
    expect(paths).toContain('src/main.tsx');
    expect(paths).toContain('src/App.tsx');
    expect(bundle.entryFilePath).toBe('src/App.tsx');
  });
});
