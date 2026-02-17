import legacy from '../zh-CN.json';
import blueprintPatch from './blueprint.json';
import { mergeResourceSection } from '../merge';

const blueprint = mergeResourceSection(
  (legacy.blueprint ?? {}) as Record<string, unknown>,
  blueprintPatch as Record<string, unknown>
);

const resources = {
  ...legacy,
  blueprint,
};

export default resources;
