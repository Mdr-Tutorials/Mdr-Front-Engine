import { compileMirToReactComponent } from './react/compileComponent';
import {
  createProjectReactBundle,
  createSingleFileBundle,
} from './react/projectScaffold';
import type {
  MirDocLike,
  ReactExportBundle,
  ReactGeneratorOptions,
} from './react/types';

type BundleFactory = (
  mirDoc: MirDocLike,
  options?: ReactGeneratorOptions
) => ReactExportBundle;

const bundleFactories: Record<string, BundleFactory> = {
  project: (mirDoc, options) =>
    createProjectReactBundle(
      compileMirToReactComponent(mirDoc, {
        componentName: options?.componentName || 'App',
      })
    ),
  component: (mirDoc, options) =>
    createSingleFileBundle(
      compileMirToReactComponent(mirDoc, options),
      'component'
    ),
  nodegraph: (mirDoc, options) =>
    createSingleFileBundle(
      compileMirToReactComponent(mirDoc, options),
      'nodegraph'
    ),
};

export const generateReactBundle = (
  mirDoc: MirDocLike,
  options?: ReactGeneratorOptions
): ReactExportBundle => {
  const resourceType = options?.resourceType ?? 'project';
  const factory = bundleFactories[resourceType] ?? bundleFactories.project;
  return factory(mirDoc, options);
};

export const generateReactCode = (
  mirDoc: MirDocLike,
  options?: ReactGeneratorOptions
) => {
  const bundle = generateReactBundle(mirDoc, options);
  return bundle.files.find((file) => file.path === bundle.entryFilePath)?.content ?? '';
};

export type { ReactExportBundle } from './react/types';
