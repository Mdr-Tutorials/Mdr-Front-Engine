import { createAuthoringEnvironment } from '@/authoring/createAuthoringEnvironment';
import type { AuthoringEnvironment } from '@/authoring/authoring.types';

export const createEmptyAuthoringEnvironment = (
  revision = 'empty'
): AuthoringEnvironment => createAuthoringEnvironment({ revision });
