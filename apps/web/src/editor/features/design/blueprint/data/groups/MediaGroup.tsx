import {
    MdrAudio,
    MdrAvatar,
    MdrEmbed,
    MdrIframe,
    MdrImage,
    MdrImageGallery,
    MdrVideo,
} from '@mdr/ui';
import type { ComponentGroup } from '../../../BlueprintEditor.types';
import { buildVariants } from '../helpers';
import { AVATAR_SIZE_OPTIONS, SIZE_OPTIONS } from '../options';
import { GALLERY_IMAGES } from '../sampleData';
import {
    EMBED_PLACEHOLDER_URL,
    PLACEHOLDER_AVATAR,
    PLACEHOLDER_IFRAME,
    PLACEHOLDER_IMAGE,
    PLACEHOLDER_VIDEO,
} from '../placeholders';

export const MEDIA_GROUP: ComponentGroup = {
    id: 'media',
    title: '媒体与嵌入',
    items: [
        {
            id: 'image',
            name: 'Image',
            preview: (
                <MdrImage src={PLACEHOLDER_IMAGE} alt="Preview" size="Medium" />
            ),
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrImage
                    src={PLACEHOLDER_IMAGE}
                    alt="Preview"
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                />
            ),
        },
        {
            id: 'avatar',
            name: 'Avatar',
            preview: <MdrAvatar src={PLACEHOLDER_AVATAR} size="Medium" />,
            sizeOptions: AVATAR_SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrAvatar
                    src={PLACEHOLDER_AVATAR}
                    size={
                        (size ?? 'Medium') as
                            | 'ExtraSmall'
                            | 'Small'
                            | 'Medium'
                            | 'Large'
                            | 'ExtraLarge'
                    }
                />
            ),
        },
        {
            id: 'image-gallery',
            name: 'Gallery',
            preview: (
                <MdrImageGallery
                    images={GALLERY_IMAGES}
                    columns={2}
                    gap="Small"
                    size="Medium"
                />
            ),
            sizeOptions: SIZE_OPTIONS,
            renderPreview: ({ size }) => (
                <MdrImageGallery
                    images={GALLERY_IMAGES}
                    columns={2}
                    gap="Small"
                    size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}
                />
            ),
            variants: buildVariants(
                ['Grid', 'List', 'Masonry'] as const,
                (layout) => (
                    <MdrImageGallery
                        images={GALLERY_IMAGES}
                        columns={2}
                        gap="Small"
                        size="Medium"
                        layout={layout}
                    />
                )
            ),
            scale: 0.55,
        },
        {
            id: 'video',
            name: 'Video',
            preview: (
                <MdrVideo
                    src=""
                    poster={PLACEHOLDER_VIDEO}
                    controls={false}
                    muted
                />
            ),
            variants: buildVariants(
                ['16:9', '4:3', '1:1'] as const,
                (ratio) => (
                    <MdrVideo
                        src=""
                        poster={PLACEHOLDER_VIDEO}
                        controls={false}
                        muted
                        aspectRatio={ratio}
                    />
                ),
                (ratio) => ratio
            ),
            scale: 0.6,
        },
        {
            id: 'audio',
            name: 'Audio',
            preview: <MdrAudio src="" controls />,
            scale: 0.6,
        },
        {
            id: 'iframe',
            name: 'Iframe',
            preview: (
                <MdrIframe
                    src="about:blank"
                    srcDoc={PLACEHOLDER_IFRAME}
                    title="Preview"
                />
            ),
            variants: buildVariants(
                ['16:9', '4:3', '1:1'] as const,
                (ratio) => (
                    <MdrIframe
                        src="about:blank"
                        srcDoc={PLACEHOLDER_IFRAME}
                        title="Preview"
                        aspectRatio={ratio}
                    />
                ),
                (ratio) => ratio
            ),
            scale: 0.55,
        },
        {
            id: 'embed',
            name: 'Embed',
            preview: <MdrEmbed type="Custom" url={EMBED_PLACEHOLDER_URL} />,
            variants: buildVariants(
                ['16:9', '4:3', '1:1'] as const,
                (ratio) => (
                    <MdrEmbed
                        type="Custom"
                        url={EMBED_PLACEHOLDER_URL}
                        aspectRatio={ratio}
                    />
                ),
                (ratio) => ratio
            ),
            scale: 0.55,
        },
    ],
};
