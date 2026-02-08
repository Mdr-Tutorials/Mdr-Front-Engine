import {
    MdrColorPicker,
    MdrDatePicker,
    MdrDateRangePicker,
    MdrFileUpload,
    MdrImageUpload,
    MdrInput,
    MdrPasswordStrength,
    MdrRange,
    MdrRating,
    MdrRegexInput,
    MdrRegionPicker,
    MdrRichTextEditor,
    MdrSearch,
    MdrSlider,
    MdrTextarea,
    MdrTimePicker,
    MdrVerificationCode,
} from '@mdr/ui';
import type { ComponentGroup } from '../../../BlueprintEditor.types';
import { SIZE_OPTIONS } from '../options';
import { REGION_OPTIONS } from '../sampleData';

export const FORM_GROUP: ComponentGroup = {
    id: 'form',
    title: '智能表单',
    items: [
        {
            id: 'input',
            name: 'Input',
            preview: (
                <MdrInput size="Medium" placeholder="Input" value="Hello" />
            ),
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrInput
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                    placeholder="Input"
                    value="Hello"
                />
            ),
        },
        {
            id: 'textarea',
            name: 'Textarea',
            preview: (
                <MdrTextarea
                    size="Medium"
                    placeholder="Textarea"
                    rows={2}
                    value="Notes"
                />
            ),
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrTextarea
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                    placeholder="Textarea"
                    rows={2}
                    value="Notes"
                />
            ),
        },
        {
            id: 'search',
            name: 'Search',
            preview: <MdrSearch size="Medium" value="Query" />,
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrSearch
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                    value="Query"
                />
            ),
            scale: 0.5,
        },
        {
            id: 'date-picker',
            name: 'DatePicker',
            preview: <MdrDatePicker size="Medium" value="2025-01-01" />,
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrDatePicker
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                    value="2025-01-01"
                />
            ),
        },
        {
            id: 'date-range-picker',
            name: 'DateRange',
            preview: (
                <MdrDateRangePicker
                    size="Medium"
                    startValue="2025-01-01"
                    endValue="2025-01-07"
                />
            ),
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrDateRangePicker
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                    startValue="2025-01-01"
                    endValue="2025-01-07"
                />
            ),
        },
        {
            id: 'time-picker',
            name: 'TimePicker',
            preview: <MdrTimePicker size="Medium" value="09:30" />,
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrTimePicker
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                    value="09:30"
                />
            ),
            scale: 0.85,
        },
        {
            id: 'region-picker',
            name: 'RegionPicker',
            preview: (
                <MdrRegionPicker
                    size="Medium"
                    options={REGION_OPTIONS}
                    defaultValue={{
                        province: 'east',
                        city: 'metro',
                        district: 'downtown',
                    }}
                />
            ),
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrRegionPicker
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                    options={REGION_OPTIONS}
                    defaultValue={{
                        province: 'east',
                        city: 'metro',
                        district: 'downtown',
                    }}
                />
            ),
            scale: 0.8,
        },
        {
            id: 'verification-code',
            name: 'Verification',
            preview: (
                <MdrVerificationCode size="Medium" defaultValue="123456" />
            ),
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrVerificationCode
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                    defaultValue="123456"
                />
            ),
            scale: 0.6,
        },
        {
            id: 'password-strength',
            name: 'PasswordStrength',
            preview: (
                <MdrPasswordStrength size="Medium" defaultValue="Abc123!@" />
            ),
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrPasswordStrength
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                    defaultValue="Abc123!@"
                />
            ),
            scale: 0.6,
        },
        {
            id: 'regex-input',
            name: 'RegexInput',
            preview: (
                <MdrRegexInput
                    size="Medium"
                    pattern="^\\S+@\\S+\\.\\S+$"
                    defaultValue="user@example.com"
                />
            ),
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrRegexInput
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                    pattern="^\\S+@\\S+\\.\\S+$"
                    defaultValue="user@example.com"
                />
            ),
        },
        {
            id: 'file-upload',
            name: 'FileUpload',
            preview: <MdrFileUpload showList={false} />,
            scale: 0.6,
        },
        {
            id: 'image-upload',
            name: 'ImageUpload',
            preview: <MdrImageUpload />,
            scale: 0.6,
        },
        {
            id: 'rich-text-editor',
            name: 'RichText',
            preview: (
                <MdrRichTextEditor
                    showToolbar={false}
                    defaultValue="<p>Preview</p>"
                />
            ),
            scale: 0.55,
        },
        {
            id: 'rating',
            name: 'Rating',
            preview: <MdrRating size="Medium" defaultValue={3} />,
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrRating
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                    defaultValue={3}
                />
            ),
        },
        {
            id: 'color-picker',
            name: 'ColorPicker',
            preview: (
                <MdrColorPicker
                    size="Medium"
                    defaultValue="#7c3aed"
                    showTextInput={false}
                />
            ),
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrColorPicker
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                    defaultValue="#7c3aed"
                    showTextInput={false}
                />
            ),
        },
        {
            id: 'slider',
            name: 'Slider',
            preview: <MdrSlider size="Medium" defaultValue={48} />,
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrSlider
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                    defaultValue={48}
                />
            ),
        },
        {
            id: 'range',
            name: 'Range',
            preview: <MdrRange defaultValue={{ min: 20, max: 70 }} />,
            scale: 0.65,
        },
    ],
};
