import legacy from '../zh-CN.json';
import blueprintPatch from './blueprint.json';
import nodeGraphPatch from './nodeGraph.json';
import { mergeResourceSection } from '../merge';

const blueprint = mergeResourceSection(
  (legacy.blueprint ?? {}) as Record<string, unknown>,
  blueprintPatch as Record<string, unknown>
);
const editor = mergeResourceSection(
  (legacy.editor ?? {}) as Record<string, unknown>,
  nodeGraphPatch as Record<string, unknown>
);

const resources = {
  ...legacy,
  editor,
  blueprint,
};

export default resources;
