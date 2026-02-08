import type { MIRDocument } from '@/core/types/engine.types';

export type ExportResourceType = 'project' | 'component' | 'nodegraph';

export type ReactExportFile = {
    path: string;
    language: 'typescript' | 'json' | 'html';
    content: string;
};

export type ReactExportBundle = {
    type: ExportResourceType;
    entryFilePath: string;
    files: ReactExportFile[];
};

export type ReactGeneratorOptions = {
    resourceType?: ExportResourceType;
    componentName?: string;
};

export type ReactComponentCompileResult = {
    componentName: string;
    code: string;
};

export type MirDocLike = MIRDocument;
