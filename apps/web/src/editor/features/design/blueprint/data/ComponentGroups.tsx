import type { ComponentGroup } from '../../BlueprintEditor.types';
import { BASE_GROUP } from './groups/BaseGroup';
import { LAYOUT_GROUP } from './groups/LayoutGroup';
import { FORM_GROUP } from './groups/FormGroup';
import { NAV_GROUP } from './groups/NavGroup';
import { MEDIA_GROUP } from './groups/MediaGroup';
import { DATA_GROUP } from './groups/DataGroup';
import { FEEDBACK_GROUP } from './groups/FeedbackGroup';

export const COMPONENT_GROUPS: ComponentGroup[] = [
    BASE_GROUP,
    LAYOUT_GROUP,
    FORM_GROUP,
    NAV_GROUP,
    MEDIA_GROUP,
    DATA_GROUP,
    FEEDBACK_GROUP,
];
