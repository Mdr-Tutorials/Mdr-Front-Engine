import { describe, expect, it } from 'vitest';
import { generateReactBundle, generateReactCode } from '../mirToReact';
import type { MIRDocument } from '@/core/types/engine.types';
import { antdReactAdapter } from '../react/antdAdapter';

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
  it('imports @mdr/ui components through adapter', () => {
    const code = generateReactCode(createDoc(), {
      resourceType: 'component',
    });
    expect(code).toContain("import { MdrButton } from '@mdr/ui';");
    expect(code).toContain('<MdrButton');
  });

  it('inlines built-in handlers into JSX attributes', () => {
    const code = generateReactCode(createDoc(), {
      resourceType: 'component',
    });
    expect(code).toContain('onClick={() => window.open(');
    expect(code).toContain(
      `window.open("https://example.com", '_blank', 'noopener,noreferrer')`
    );
    expect(code).not.toContain('const params =');
    expect(code).not.toContain('runNavigate');
  });

  it('omits props interface when MIR has no props', () => {
    const code = generateReactCode(createDoc(), {
      resourceType: 'component',
    });
    expect(code).not.toContain('interface DemoProps');
    expect(code).toContain('export default function Demo()');
  });

  it('emits full project bundle for project resource type', () => {
    const bundle = generateReactBundle(createDoc(), {
      resourceType: 'project',
    });
    const paths = bundle.files.map((item) => item.path);
    expect(paths).toContain('package.json');
    expect(paths).toContain('src/main.tsx');
    expect(paths).toContain('src/App.tsx');
    expect(bundle.entryFilePath).toBe('src/App.tsx');
  });

  it('maps RadixLabel through react adapter imports', () => {
    const doc = createDoc();
    doc.ui.root = {
      id: 'root',
      type: 'RadixLabel',
      text: 'Name',
    };

    const code = generateReactCode(doc, { resourceType: 'component' });
    expect(code).toContain("import * as Label from '@radix-ui/react-label';");
    expect(code).toContain('<Label.Root>');
  });

  it('emits adapter diagnostics for unknown Radix component', () => {
    const doc = createDoc();
    doc.ui.root = {
      id: 'root',
      type: 'RadixUnknownThing',
      text: 'Fallback',
    };

    const bundle = generateReactBundle(doc, { resourceType: 'component' });
    expect(
      bundle.diagnostics?.some(
        (d) => d.code === 'REACT_ADAPTER_UNKNOWN_RADIX_COMPONENT'
      )
    ).toBe(true);
  });

  it('supports esm.sh import strategy without package dependency declarations', () => {
    const code = generateReactCode(createDoc(), {
      resourceType: 'component',
      packageResolver: {
        strategy: 'esm-sh',
        packageVersions: {
          '@mdr/ui': '0.1.0',
        },
      },
    });
    expect(code).toContain("from 'https://esm.sh/@mdr/ui@0.1.0';");

    const bundle = generateReactBundle(createDoc(), {
      resourceType: 'project',
      packageResolver: {
        strategy: 'esm-sh',
        packageVersions: {
          '@mdr/ui': '0.1.0',
        },
      },
    });
    const packageJson = bundle.files.find((f) => f.path === 'package.json');
    expect(packageJson).toBeTruthy();
    expect(packageJson?.content).not.toContain('"@mdr/ui"');
  });

  it('supports antd adapter with esm.sh remote imports', () => {
    const doc = createDoc();
    doc.ui.root = {
      id: 'root',
      type: 'AntdFormItem',
      children: [
        {
          id: 'name-input',
          type: 'AntdInput',
        },
      ],
    };

    const code = generateReactCode(doc, {
      resourceType: 'component',
      adapter: antdReactAdapter,
      packageResolver: {
        strategy: 'esm-sh',
        packageVersions: {
          antd: '5.28.0',
        },
      },
    });

    expect(code).toContain(
      "import { Form } from 'https://esm.sh/antd@5.28.0';"
    );
    expect(code).toContain(
      "import { Input } from 'https://esm.sh/antd@5.28.0';"
    );
    expect(code).toContain('<Form.Item>');
    expect(code).toContain('<Input />');
  });

  it('maps Antd runtime types to production imports in default export mode', () => {
    const doc = createDoc();
    doc.ui.root = {
      id: 'root',
      type: 'AntdButton',
      text: 'Button',
      props: {
        type: 'primary',
        size: 'small',
      },
      children: [
        {
          id: 'form-item',
          type: 'AntdFormItem',
          props: {
            label: 'Field',
          },
        },
      ],
    };

    const code = generateReactCode(doc, { resourceType: 'component' });
    expect(code).toContain("import { Button } from 'antd';");
    expect(code).toContain("import { Form } from 'antd';");
    expect(code).toContain('<Button');
    expect(code).toContain('<Form.Item');
  });

  it('maps Mui runtime types to production imports in default export mode', () => {
    const doc = createDoc();
    doc.ui.root = {
      id: 'root',
      type: 'MuiButton',
      text: 'Button',
      props: {
        variant: 'contained',
        size: 'small',
      },
    };

    const code = generateReactCode(doc, { resourceType: 'component' });
    expect(code).toContain("import Button from '@mui/material/Button';");
    expect(code).toContain('<Button');
  });

  it('maps MdrIcon fontawesome refs to native imports', () => {
    const doc = createDoc();
    doc.ui.root = {
      id: 'root',
      type: 'MdrIcon',
      props: {
        size: 20,
        iconRef: {
          provider: 'fontawesome',
          name: '8',
        },
      },
    };

    const code = generateReactCode(doc, { resourceType: 'component' });
    expect(code).toContain(
      "import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';"
    );
    expect(code).toContain(
      "import { fa8 } from '@fortawesome/free-solid-svg-icons';"
    );
    expect(code).toContain('<FontAwesomeIcon');
    expect(code).toContain('style={{ fontSize: 20 }}');
    expect(code).toContain('icon={fa8}');
    expect(code).not.toContain('size={20}');
    expect(code).not.toContain('iconRef=');
  });

  it('maps MdrIcon ant-design refs to native icon components', () => {
    const doc = createDoc();
    doc.ui.root = {
      id: 'root',
      type: 'MdrIcon',
      props: {
        iconRef: {
          provider: 'ant-design-icons',
          name: 'HomeOutlined',
        },
      },
    };

    const code = generateReactCode(doc, { resourceType: 'component' });
    expect(code).toContain("import { HomeOutlined } from '@ant-design/icons';");
    expect(code).toContain('<HomeOutlined');
    expect(code).not.toContain('iconRef=');
  });

  it('maps MdrIcon heroicons refs to native icon components', () => {
    const doc = createDoc();
    doc.ui.root = {
      id: 'root',
      type: 'MdrIcon',
      props: {
        iconRef: {
          provider: 'heroicons',
          name: 'AcademicCap',
        },
      },
    };

    const code = generateReactCode(doc, { resourceType: 'component' });
    expect(code).toContain(
      "import { AcademicCapIcon } from '@heroicons/react/24/outline';"
    );
    expect(code).toContain('<AcademicCapIcon');
    expect(code).not.toContain('iconRef=');
  });

  it('maps MdrIcon heroicons solid refs to solid import', () => {
    const doc = createDoc();
    doc.ui.root = {
      id: 'root',
      type: 'MdrIcon',
      props: {
        iconRef: {
          provider: 'heroicons',
          name: 'AcademicCap',
          variant: 'solid',
        },
      },
    };

    const code = generateReactCode(doc, { resourceType: 'component' });
    expect(code).toContain(
      "import { AcademicCapIcon } from '@heroicons/react/24/solid';"
    );
    expect(code).toContain('<AcademicCapIcon');
    expect(code).not.toContain('iconRef=');
  });

  it('maps MdrIcon mui refs to native icon components', () => {
    const doc = createDoc();
    doc.ui.root = {
      id: 'root',
      type: 'MdrIcon',
      props: {
        iconRef: {
          provider: 'mui-icons',
          name: 'Home',
        },
      },
    };

    const code = generateReactCode(doc, { resourceType: 'component' });
    expect(code).toContain("import Home from '@mui/icons-material/Home';");
    expect(code).toContain('<Home');
    expect(code).not.toContain('iconRef=');
  });

  it('adds prefixes when multiple libraries import same component name', () => {
    const doc = createDoc();
    doc.ui.root = {
      id: 'root',
      type: 'div',
      children: [
        {
          id: 'mui-btn',
          type: 'MuiButton',
          text: 'MUI',
        },
        {
          id: 'antd-btn',
          type: 'AntdButton',
          text: 'Antd',
        },
      ],
    };

    const code = generateReactCode(doc, { resourceType: 'component' });
    expect(code).toContain("import MuiButton from '@mui/material/Button';");
    expect(code).toContain("import { Button as AntdButton } from 'antd';");
    expect(code).toContain('<MuiButton>');
    expect(code).toContain('<AntdButton>');
  });

  it('extracts mounted css into external css files', () => {
    const doc = createDoc();
    doc.ui.root = {
      id: 'root',
      type: 'div',
      props: {
        className: 'hero',
        mountedCss: [
          {
            path: 'src/styles/mounted/hero.css',
            content: '.hero { color: red; }',
          },
        ],
      },
    };

    const bundle = generateReactBundle(doc, { resourceType: 'project' });
    const appFile = bundle.files.find((file) => file.path === 'src/App.tsx');
    const cssFile = bundle.files.find(
      (file) => file.path === 'src/styles/mounted/hero.css'
    );

    expect(appFile?.content).toContain("import './styles/mounted/hero.css';");
    expect(appFile?.content).not.toContain('mountedCss=');
    expect(cssFile?.content).toContain('.hero { color: red; }');
  });

  it('strips editor-only data attributes from exported props', () => {
    const doc = createDoc();
    doc.ui.root = {
      id: 'root',
      type: 'div',
      props: {
        'data-layout-role': 'main',
        'data-testid': 'keep-me',
        dataAttributes: {
          'data-layout-pattern': 'split',
          'data-theme': 'light',
        },
      },
    };

    const code = generateReactCode(doc, { resourceType: 'component' });
    expect(code).not.toContain('data-layout-role');
    expect(code).not.toContain('data-layout-pattern');
    expect(code).toContain('data-testid="keep-me"');
    expect(code).toContain('dataAttributes={{"data-theme":"light"}}');
  });

  it('generates list map and data-path resolution helpers', () => {
    const doc = createDoc();
    doc.ui.root = {
      id: 'root',
      type: 'MdrDiv',
      data: {
        extend: {
          products: [{ id: 'p1', name: 'Desk Lamp' }],
        },
      },
      children: [
        {
          id: 'list',
          type: 'MdrDiv',
          list: {
            source: { $data: 'products' },
            keyBy: 'id',
          },
          children: [{ id: 'name', type: 'MdrText', text: 'name' }],
        },
      ],
    };

    const code = generateReactCode(doc, { resourceType: 'component' });
    expect(code).not.toContain('__readByPath');
    expect(code).not.toContain('__resolvePathOrLiteral');
    expect(code).not.toContain('{(() => {');
    expect(code).not.toContain('const itemScope =');
    expect(code).toContain('.map((item, index)');
    expect(code).toContain('key={String((item as any)?.id ?? index)}');
  });
});
