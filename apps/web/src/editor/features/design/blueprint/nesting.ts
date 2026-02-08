const NON_NESTABLE_TYPE_LIST = [
    'input',
    'mdrinput',
    'textarea',
    'mdrtextarea',
    'button',
    'mdrbutton',
    'mdrbuttonlink',
] as const;

export const NON_NESTABLE_TYPES = new Set<string>(NON_NESTABLE_TYPE_LIST);

export const isNonNestableType = (type: string) =>
    NON_NESTABLE_TYPES.has(type.toLowerCase());
