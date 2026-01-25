import type { ReactNode } from "react"
import {
  MdrAnchorNavigation,
  MdrAudio,
  MdrAvatar,
  MdrBadge,
  MdrBreadcrumb,
  MdrButton,
  MdrButtonLink,
  MdrCard,
  MdrCheckList,
  MdrCollapse,
  MdrColorPicker,
  MdrDataGrid,
  MdrDatePicker,
  MdrDateRangePicker,
  MdrDiv,
  MdrDrawer,
  MdrEmbed,
  MdrEmpty,
  MdrFileUpload,
  MdrHeading,
  MdrIcon,
  MdrIconLink,
  MdrIframe,
  MdrImage,
  MdrImageGallery,
  MdrImageUpload,
  MdrInput,
  MdrLink,
  MdrList,
  MdrMessage,
  MdrModal,
  MdrNav,
  MdrNavbar,
  MdrNotification,
  MdrPagination,
  MdrPanel,
  MdrParagraph,
  MdrPasswordStrength,
  MdrPopover,
  MdrProgress,
  MdrRange,
  MdrRating,
  MdrRegexInput,
  MdrRegionPicker,
  MdrRichTextEditor,
  MdrSearch,
  MdrSection,
  MdrSkeleton,
  MdrSlider,
  MdrSidebar,
  MdrSpinner,
  MdrStatistic,
  MdrSteps,
  MdrTable,
  MdrTabs,
  MdrTag,
  MdrTextarea,
  MdrText,
  MdrTimePicker,
  MdrTimeline,
  MdrTooltip,
  MdrTree,
  MdrTreeSelect,
  MdrVerificationCode,
  MdrVideo,
} from "@mdr/ui"
import {
  Home,
  Laptop,
  Monitor,
  Settings,
  Smartphone,
  Sparkles,
  Tablet,
  Watch,
} from "lucide-react"
import type {
  ComponentGroup,
  ComponentPreviewItem,
  ComponentPreviewOption,
  ComponentPreviewStatus,
  ComponentPreviewVariant,
  QuickViewportPreset,
  RouteItem,
  ViewportPreset,
} from "./BlueprintEditor.types"

export const DEFAULT_ROUTES: RouteItem[] = [
  { id: "home", path: "/" },
  { id: "product", path: "/product/:id" },
  { id: "search", path: "/search?q=:keyword" },
]

export const VIEWPORT_QUICK_PRESETS: QuickViewportPreset[] = [
  { id: "quick-desktop", labelKey: "viewport.quickPresets.desktop", width: "1440", height: "900" },
  { id: "quick-hd", labelKey: "viewport.quickPresets.hd", width: "1280", height: "720" },
  { id: "quick-ipad", labelKey: "viewport.quickPresets.ipad", width: "1024", height: "768" },
  { id: "quick-iphone", labelKey: "viewport.quickPresets.iphone", width: "390", height: "844" },
  { id: "quick-se", labelKey: "viewport.quickPresets.se", width: "375", height: "667" },
]

export const VIEWPORT_DEVICE_PRESETS: ViewportPreset[] = [
  { id: "desktop-fhd", nameKey: "devices.desktopFhd", kind: "Desktop", kindKey: "devices.kinds.desktop", width: "1920", height: "1080", icon: Monitor },
  { id: "desktop-hd", nameKey: "devices.desktopHd", kind: "Desktop", kindKey: "devices.kinds.desktop", width: "1366", height: "768", icon: Monitor },
  { id: "macbook-air-13", nameKey: "devices.macbookAir13", kind: "Laptop", kindKey: "devices.kinds.laptop", width: "1440", height: "900", icon: Laptop },
  { id: "macbook-pro-14", nameKey: "devices.macbookPro14", kind: "Laptop", kindKey: "devices.kinds.laptop", width: "1512", height: "982", icon: Laptop },
  { id: "ipad-pro-11", nameKey: "devices.ipadPro11", kind: "Tablet", kindKey: "devices.kinds.tablet", width: "834", height: "1194", icon: Tablet },
  { id: "ipad-mini", nameKey: "devices.ipadMini", kind: "Tablet", kindKey: "devices.kinds.tablet", width: "768", height: "1024", icon: Tablet },
  { id: "pixel-8", nameKey: "devices.pixel8", kind: "Phone", kindKey: "devices.kinds.phone", width: "412", height: "915", icon: Smartphone },
  { id: "iphone-15-pro", nameKey: "devices.iphone15Pro", kind: "Phone", kindKey: "devices.kinds.phone", width: "393", height: "852", icon: Smartphone },
  { id: "iphone-13", nameKey: "devices.iphone13", kind: "Phone", kindKey: "devices.kinds.phone", width: "390", height: "844", icon: Smartphone },
  { id: "iphone-se", nameKey: "devices.iphoneSe", kind: "Phone", kindKey: "devices.kinds.phone", width: "375", height: "667", icon: Smartphone },
  { id: "watch-41", nameKey: "devices.watch41", kind: "Watch", kindKey: "devices.kinds.watch", width: "198", height: "242", icon: Watch },
]

export const VIEWPORT_ZOOM_RANGE = {
  min: 50,
  max: 160,
  step: 5,
  default: 100,
}

export const DEFAULT_PREVIEW_SCALE = 0.72
export const COMPACT_PREVIEW_SCALE = 0.6
const WIDE_PREVIEW_SCALE_BOOST = 1.18

const TEXT_SIZES = ["Tiny", "Small", "Medium", "Large", "Big"] as const
const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const
const PARAGRAPH_SIZES = ["Small", "Medium", "Large"] as const
const BUTTON_CATEGORIES = ["Primary", "Secondary", "Danger", "SubDanger", "Warning", "SubWarning", "Ghost"] as const
const INPUT_SIZES = ["Small", "Medium", "Large"] as const
const SECTION_SIZES = ["Small", "Medium", "Large"] as const
const CARD_VARIANTS = ["Default", "Bordered", "Elevated", "Flat"] as const
const PANEL_VARIANTS = ["Default", "Bordered", "Filled"] as const
const NAV_COLUMNS = [2, 3] as const
const NAVBAR_SIZES = ["Small", "Medium", "Large"] as const
const IMAGE_SIZES = ["Small", "Medium", "Large"] as const
const AVATAR_SIZES = ["ExtraSmall", "Small", "Medium", "Large", "ExtraLarge"] as const
const TABLE_SIZES = ["Small", "Medium", "Large"] as const
const LIST_SIZES = ["Small", "Medium", "Large"] as const
const TAG_VARIANTS = ["Soft", "Outline", "Solid"] as const
const PROGRESS_STATUSES = ["Default", "Success", "Warning", "Danger"] as const
const SPINNER_SIZES = ["Small", "Medium", "Large"] as const
const MODAL_SIZES = ["Small", "Medium", "Large"] as const
const DRAWER_PLACEMENTS = ["Left", "Right", "Top", "Bottom"] as const
const TOOLTIP_PLACEMENTS = ["Top", "Right", "Bottom", "Left"] as const
const MESSAGE_TYPES = ["Info", "Success", "Warning", "Danger"] as const
const NOTIFICATION_TYPES = ["Info", "Success", "Warning", "Danger"] as const
const SKELETON_VARIANTS = ["Text", "Circle", "Rect"] as const
const STEPS_DIRECTIONS = ["Horizontal", "Vertical"] as const

const SIZE_OPTIONS: ComponentPreviewOption[] = [
  { id: "S", label: "S", value: "Small" },
  { id: "M", label: "M", value: "Medium" },
  { id: "L", label: "L", value: "Large" },
]

const BUTTON_SIZE_OPTIONS: ComponentPreviewOption[] = [
  { id: "S", label: "S", value: "Small" },
  { id: "M", label: "M", value: "Medium" },
  { id: "L", label: "L", value: "Big" },
]

const TEXT_SIZE_OPTIONS: ComponentPreviewOption[] = [
  { id: "S", label: "S", value: "Small" },
  { id: "M", label: "M", value: "Medium" },
  { id: "L", label: "L", value: "Large" },
]

const WIDE_GROUP_IDS = new Set(["navigation", "layout", "chart"])
const WIDE_COMPONENT_IDS = new Set(["date-range-picker", "steps", "slider", "search", "file-upload", "regex-input", "image-upload", "date-picker", "verification-code", "rich-text-editor", "range"])
const createPlaceholderSvg = (label: string, width = 160, height = 120) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#eef1f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#7b8794" dominant-baseline="middle" text-anchor="middle">${label}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const buildVariants = <T extends string | number>(
  values: readonly T[],
  render: (value: T) => ReactNode,
  labelFormatter?: (value: T) => string,
  scale?: number | ((value: T) => number),
): ComponentPreviewVariant[] =>
  values.map((value) => ({
    id: String(value),
    label: labelFormatter ? labelFormatter(value) : String(value),
    element: render(value),
    scale: typeof scale === "function" ? scale(value) : scale,
  }))

export const getDefaultSizeId = (options?: ComponentPreviewOption[]) =>
  options?.find((option) => option.value === "Medium" || option.id === "M")?.id ?? options?.[0]?.id

export const getDefaultStatusIndex = (options?: ComponentPreviewStatus[], preferred?: string) => {
  if (!options?.length) return 0
  if (preferred) {
    const index = options.findIndex((option) => option.value === preferred || option.id === preferred)
    if (index >= 0) return index
  }
  return 0
}

export const getPreviewScale = (baseScale: number | undefined, isWide: boolean) => {
  const resolved = baseScale ?? DEFAULT_PREVIEW_SCALE
  if (!isWide) return resolved
  return Math.min(resolved * WIDE_PREVIEW_SCALE_BOOST, 0.95)
}

export const isWideComponent = (group: ComponentGroup, item: ComponentPreviewItem) =>
  WIDE_GROUP_IDS.has(group.id) || WIDE_COMPONENT_IDS.has(item.id)

const PLACEHOLDER_IMAGE = createPlaceholderSvg("IMG")
const PLACEHOLDER_AVATAR = createPlaceholderSvg("AV", 80, 80)
const PLACEHOLDER_VIDEO = createPlaceholderSvg("VIDEO")
const PLACEHOLDER_IFRAME = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:Arial,sans-serif;color:#6b7280;">Iframe</div>`
const EMBED_PLACEHOLDER_URL = `data:text/html;charset=utf-8,${encodeURIComponent(
  "<div style=\"display:flex;align-items:center;justify-content:center;height:100%;font-family:Arial,sans-serif;color:#6b7280;\">Embed</div>",
)}`

const NAVBAR_ITEMS = [
  { label: "Home", href: "#", active: true },
  { label: "Docs", href: "#" },
]

const SIDEBAR_ITEMS = [
  { label: "Overview", href: "#", active: true, icon: <Home size={14} /> },
  { label: "Settings", href: "#", icon: <Settings size={14} /> },
]

const BREADCRUMB_ITEMS = [
  { label: "Home", href: "#" },
  { label: "Library", href: "#" },
  { label: "Assets" },
]

const ANCHOR_ITEMS = [
  { id: "intro", label: "Intro" },
  { id: "usage", label: "Usage" },
]

const TAB_ITEMS = [
  { key: "design", label: "Design", content: <MdrText size="Tiny">Panel</MdrText> },
  { key: "code", label: "Code", content: <MdrText size="Tiny">Snippet</MdrText> },
]

const COLLAPSE_ITEMS = [
  { key: "panel-1", title: "Panel 1", content: <MdrText size="Tiny">Details</MdrText> },
  { key: "panel-2", title: "Panel 2", content: <MdrText size="Tiny">More</MdrText> },
]

const TABLE_COLUMNS = [
  { key: "name", title: "Name", dataIndex: "name" },
  { key: "status", title: "Status", dataIndex: "status" },
]

const TABLE_DATA = [
  { name: "Alpha", status: "Ready" },
  { name: "Beta", status: "Review" },
]

const GRID_COLUMNS = [
  { key: "title", title: "Title", dataIndex: "title" },
  { key: "value", title: "Value", dataIndex: "value", align: "Right" },
]

const GRID_DATA = [
  { title: "Users", value: "128" },
  { title: "Clicks", value: "42" },
]

const LIST_ITEMS = [
  { title: "Checklist", description: "Setup tasks" },
  { title: "Review", description: "Design pass" },
]

const CHECKLIST_ITEMS = [
  { label: "Wireframes", value: "wireframes", checked: true },
  { label: "Prototype", value: "prototype" },
]

const TREE_DATA = [
  {
    id: "root",
    label: "Root",
    children: [
      { id: "child-1", label: "Child 1" },
      { id: "child-2", label: "Child 2" },
    ],
  },
]

const TREE_SELECT_OPTIONS = [
  {
    id: "group-1",
    label: "Group",
    children: [
      { id: "option-1", label: "Option 1" },
      { id: "option-2", label: "Option 2" },
    ],
  },
]

const REGION_OPTIONS = [
  {
    label: "East",
    value: "east",
    children: [
      {
        label: "Metro",
        value: "metro",
        children: [
          { label: "Downtown", value: "downtown" },
          { label: "Uptown", value: "uptown" },
        ],
      },
    ],
  },
]

const TIMELINE_ITEMS = [
  { title: "Draft", time: "09:00", status: "Success" },
  { title: "Review", time: "10:30", status: "Warning" },
]

const STEPS_ITEMS = [
  { title: "Collect" },
  { title: "Design" },
  { title: "Ship" },
]

const GALLERY_IMAGES = [
  { src: createPlaceholderSvg("A", 120, 90), alt: "A" },
  { src: createPlaceholderSvg("B", 120, 90), alt: "B" },
  { src: createPlaceholderSvg("C", 120, 90), alt: "C" },
]

export const COMPONENT_GROUPS: ComponentGroup[] = [
  {
    id: "base",
    title: "基础组件",
    items: [
      {
        id: "text",
        name: "Text",
        preview: <MdrText size="Medium">Text</MdrText>,
        sizeOptions: TEXT_SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrText size={(size ?? "Medium") as "Small" | "Medium" | "Large"}>Text</MdrText>
        ),
        variants: buildVariants(TEXT_SIZES, (size) => (
          <MdrText size={size}>Text</MdrText>
        )),
      },
      {
        id: "heading",
        name: "Heading",
        preview: <MdrHeading level={2}>Heading</MdrHeading>,
        variants: buildVariants(
          HEADING_LEVELS,
          (level) => <MdrHeading level={level}>H{level}</MdrHeading>,
          (level) => `H${level}`,
        ),
      },
      {
        id: "paragraph",
        name: "Paragraph",
        preview: <MdrParagraph size="Medium">Paragraph</MdrParagraph>,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrParagraph size={(size ?? "Medium") as "Small" | "Medium" | "Large"}>Paragraph</MdrParagraph>
        ),
        variants: buildVariants(PARAGRAPH_SIZES, (size) => (
          <MdrParagraph size={size}>Paragraph</MdrParagraph>
        )),
      },
      {
        id: "button",
        name: "Button",
        preview: <MdrButton text="Button" size="Medium" category="Primary" />,
        sizeOptions: BUTTON_SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrButton text="Button" size={(size ?? "Medium") as "Small" | "Medium" | "Big"} category="Primary" />
        ),
        variants: buildVariants(BUTTON_CATEGORIES, (category) => (
          <MdrButton text={category} size="Medium" category={category} />
        )),
      },
      {
        id: "button-link",
        name: "ButtonLink",
        preview: (
          <MdrButtonLink text="Link" to="/blueprint" size="Medium" category="Secondary" />
        ),
        sizeOptions: BUTTON_SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrButtonLink
            text="Link"
            to="/blueprint"
            size={(size ?? "Medium") as "Small" | "Medium" | "Big"}
            category="Secondary"
          />
        ),
        variants: buildVariants(BUTTON_CATEGORIES, (category) => (
          <MdrButtonLink text={category} to="/blueprint" size="Medium" category={category} />
        )),
      },
      {
        id: "icon",
        name: "Icon",
        preview: <MdrIcon icon={Sparkles} size={20} />,
        variants: buildVariants(
          [12, 16, 20, 24] as const,
          (size) => <MdrIcon icon={Sparkles} size={size} />,
          (size) => `${size}px`,
        ),
      },
      {
        id: "icon-link",
        name: "IconLink",
        preview: <MdrIconLink icon={Sparkles} to="/blueprint" size={18} />,
        variants: buildVariants(
          [14, 18, 22] as const,
          (size) => <MdrIconLink icon={Sparkles} to="/blueprint" size={size} />,
          (size) => `${size}px`,
        ),
      },
      {
        id: "link",
        name: "Link",
        preview: <MdrLink to="/blueprint" text="Link" />,
      },
    ],
  },
  {
    id: "layout",
    title: "布局组件",
    items: [
      {
        id: "div",
        name: "Div",
        preview: (
          <MdrDiv padding="6px" backgroundColor="var(--color-1)" borderRadius="6px">
            <MdrText size="Tiny">Div</MdrText>
          </MdrDiv>
        ),
      },
      {
        id: "flex",
        name: "Flex",
        preview: (
          <MdrDiv display="Flex" gap="6px" padding="6px" backgroundColor="var(--color-1)" borderRadius="6px">
            <MdrDiv width="18px" height="18px" backgroundColor="var(--color-3)" borderRadius="4px">
              {null}
            </MdrDiv>
            <MdrDiv width="18px" height="18px" backgroundColor="var(--color-4)" borderRadius="4px">
              {null}
            </MdrDiv>
            <MdrDiv width="18px" height="18px" backgroundColor="var(--color-5)" borderRadius="4px">
              {null}
            </MdrDiv>
          </MdrDiv>
        ),
      },
      {
        id: "grid",
        name: "Grid",
        preview: (
          <MdrDiv
            display="Grid"
            gap="6px"
            padding="6px"
            backgroundColor="var(--color-1)"
            borderRadius="6px"
            style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
          >
            <MdrDiv height="16px" backgroundColor="var(--color-3)" borderRadius="4px">
              {null}
            </MdrDiv>
            <MdrDiv height="16px" backgroundColor="var(--color-4)" borderRadius="4px">
              {null}
            </MdrDiv>
            <MdrDiv height="16px" backgroundColor="var(--color-5)" borderRadius="4px">
              {null}
            </MdrDiv>
            <MdrDiv height="16px" backgroundColor="var(--color-6)" borderRadius="4px">
              {null}
            </MdrDiv>
          </MdrDiv>
        ),
      },
      {
        id: "section",
        name: "Section",
        preview: (
          <MdrSection size="Medium" padding="Small" backgroundColor="Light">
            <MdrText size="Tiny">Section</MdrText>
          </MdrSection>
        ),
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrSection size={(size ?? "Medium") as "Small" | "Medium" | "Large"} padding="Small" backgroundColor="Light">
            <MdrText size="Tiny">Section</MdrText>
          </MdrSection>
        ),
        variants: buildVariants(SECTION_SIZES, (size) => (
          <MdrSection size={size} padding="Small" backgroundColor="Light">
            <MdrText size="Tiny">Section</MdrText>
          </MdrSection>
        )),
        scale: 0.65,
      },
      {
        id: "card",
        name: "Card",
        preview: (
          <MdrCard size="Medium" variant="Bordered" padding="Small">
            <MdrText size="Tiny">Card</MdrText>
          </MdrCard>
        ),
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrCard size={(size ?? "Medium") as "Small" | "Medium" | "Large"} variant="Bordered" padding="Small">
            <MdrText size="Tiny">Card</MdrText>
          </MdrCard>
        ),
        variants: buildVariants(CARD_VARIANTS, (variant) => (
          <MdrCard size="Medium" variant={variant} padding="Small">
            <MdrText size="Tiny">{variant}</MdrText>
          </MdrCard>
        )),
      },
      {
        id: "panel",
        name: "Panel",
        preview: (
          <MdrPanel size="Medium" title="Panel">
            <MdrText size="Tiny">Content</MdrText>
          </MdrPanel>
        ),
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrPanel size={(size ?? "Medium") as "Small" | "Medium" | "Large"} title="Panel">
            <MdrText size="Tiny">Content</MdrText>
          </MdrPanel>
        ),
        variants: buildVariants(PANEL_VARIANTS, (variant) => (
          <MdrPanel size="Medium" variant={variant} title="Panel">
            <MdrText size="Tiny">{variant}</MdrText>
          </MdrPanel>
        )),
        scale: 0.64,
      },
    ],
  },
  {
    id: "form",
    title: "智能表单",
    items: [
      {
        id: "input",
        name: "Input",
        preview: <MdrInput size="Medium" placeholder="Input" value="Hello" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrInput size={(size ?? "Medium") as "Small" | "Medium" | "Large"} placeholder="Input" value="Hello" />
        ),
        variants: buildVariants(INPUT_SIZES, (size) => (
          <MdrInput size={size} placeholder="Input" value="Hello" />
        )),
      },
      {
        id: "textarea",
        name: "Textarea",
        preview: <MdrTextarea size="Medium" placeholder="Textarea" rows={2} value="Notes" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrTextarea
            size={(size ?? "Medium") as "Small" | "Medium" | "Large"}
            placeholder="Textarea"
            rows={2}
            value="Notes"
          />
        ),
        variants: buildVariants(INPUT_SIZES, (size) => (
          <MdrTextarea size={size} placeholder="Textarea" rows={2} value="Notes" />
        )),
      },
      {
        id: "search",
        name: "Search",
        preview: <MdrSearch size="Medium" value="Query" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrSearch size={(size ?? "Medium") as "Small" | "Medium" | "Large"} value="Query" />
        ),
        variants: buildVariants(INPUT_SIZES, (size) => (
          <MdrSearch size={size} value="Query" />
        )),
        scale: 0.45,
      },
      {
        id: "date-picker",
        name: "DatePicker",
        preview: <MdrDatePicker size="Medium" value="2025-01-01" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrDatePicker size={(size ?? "Medium") as "Small" | "Medium" | "Large"} value="2025-01-01" />
        ),
        variants: buildVariants(INPUT_SIZES, (size) => (
          <MdrDatePicker size={size} value="2025-01-01" />
        )),
      },
      {
        id: "date-range-picker",
        name: "DateRange",
        preview: <MdrDateRangePicker size="Medium" startValue="2025-01-01" endValue="2025-01-07" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrDateRangePicker
            size={(size ?? "Medium") as "Small" | "Medium" | "Large"}
            startValue="2025-01-01"
            endValue="2025-01-07"
          />
        ),
        variants: buildVariants(INPUT_SIZES, (size) => (
          <MdrDateRangePicker size={size} startValue="2025-01-01" endValue="2025-01-07" />
        )),
        scale: 0.5,
      },
      {
        id: "time-picker",
        name: "TimePicker",
        preview: <MdrTimePicker size="Medium" value="09:30" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrTimePicker size={(size ?? "Medium") as "Small" | "Medium" | "Large"} value="09:30" />
        ),
        variants: buildVariants(INPUT_SIZES, (size) => (
          <MdrTimePicker size={size} value="09:30" />
        )),
        scale: 0.65,
      },
      {
        id: "region-picker",
        name: "RegionPicker",
        preview: <MdrRegionPicker size="Medium" options={REGION_OPTIONS} defaultValue={{ province: "east", city: "metro", district: "downtown" }} />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrRegionPicker
            size={(size ?? "Medium") as "Small" | "Medium" | "Large"}
            options={REGION_OPTIONS}
            defaultValue={{ province: "east", city: "metro", district: "downtown" }}
          />
        ),
        variants: buildVariants(INPUT_SIZES, (size) => (
          <MdrRegionPicker
            size={size}
            options={REGION_OPTIONS}
            defaultValue={{ province: "east", city: "metro", district: "downtown" }}
          />
        )),
        scale: 0.58,
      },
      {
        id: "verification-code",
        name: "Verification",
        preview: <MdrVerificationCode size="Medium" defaultValue="123456" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrVerificationCode size={(size ?? "Medium") as "Small" | "Medium" | "Large"} defaultValue="123456" />
        ),
        variants: buildVariants(INPUT_SIZES, (size) => (
          <MdrVerificationCode size={size} defaultValue="123456" />
        )),
        scale: 0.4,
      },
      {
        id: "password-strength",
        name: "PasswordStrength",
        preview: <MdrPasswordStrength size="Medium" defaultValue="Abc123!@" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrPasswordStrength size={(size ?? "Medium") as "Small" | "Medium" | "Large"} defaultValue="Abc123!@" />
        ),
        variants: buildVariants(INPUT_SIZES, (size) => (
          <MdrPasswordStrength size={size} defaultValue="Abc123!@" />
        )),
        scale: 0.6,
      },
      {
        id: "regex-input",
        name: "RegexInput",
        preview: <MdrRegexInput size="Medium" pattern="^\\S+@\\S+\\.\\S+$" defaultValue="user@example.com" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrRegexInput
            size={(size ?? "Medium") as "Small" | "Medium" | "Large"}
            pattern="^\\S+@\\S+\\.\\S+$"
            defaultValue="user@example.com"
          />
        ),
        variants: buildVariants(INPUT_SIZES, (size) => (
          <MdrRegexInput size={size} pattern="^\\S+@\\S+\\.\\S+$" defaultValue="user@example.com" />
        )),
      },
      {
        id: "file-upload",
        name: "FileUpload",
        preview: <MdrFileUpload showList={false} />,
        scale: 0.6,
      },
      {
        id: "image-upload",
        name: "ImageUpload",
        preview: <MdrImageUpload />,
        scale: 0.6,
      },
      {
        id: "rich-text-editor",
        name: "RichText",
        preview: <MdrRichTextEditor showToolbar={false} defaultValue="<p>Preview</p>" />,
        scale: 0.55,
      },
      {
        id: "rating",
        name: "Rating",
        preview: <MdrRating size="Medium" defaultValue={3} />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrRating size={(size ?? "Medium") as "Small" | "Medium" | "Large"} defaultValue={3} />
        ),
        variants: buildVariants(INPUT_SIZES, (size) => (
          <MdrRating size={size} defaultValue={3} />
        )),
      },
      {
        id: "color-picker",
        name: "ColorPicker",
        preview: <MdrColorPicker size="Medium" defaultValue="#7c3aed" showTextInput={false} />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrColorPicker
            size={(size ?? "Medium") as "Small" | "Medium" | "Large"}
            defaultValue="#7c3aed"
            showTextInput={false}
          />
        ),
        variants: buildVariants(INPUT_SIZES, (size) => (
          <MdrColorPicker size={size} defaultValue="#7c3aed" showTextInput={false} />
        )),
      },
      {
        id: "slider",
        name: "Slider",
        preview: <MdrSlider size="Medium" defaultValue={48} />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrSlider size={(size ?? "Medium") as "Small" | "Medium" | "Large"} defaultValue={48} />
        ),
        variants: buildVariants(INPUT_SIZES, (size) => (
          <MdrSlider size={size} defaultValue={48} />
        )),
      },
      {
        id: "range",
        name: "Range",
        preview: <MdrRange defaultValue={{ min: 20, max: 70 }} />,
        scale: 0.65,
      },
    ],
  },
  {
    id: "nav",
    title: "导航组件",
    items: [
      {
        id: "nav",
        name: "Nav",
        preview: (
          <MdrNav columns={2} backgroundStyle="Solid" style={{ width: 180 }}>
            <div className="MdrNavLeft">
              <MdrText size="Tiny">Brand</MdrText>
            </div>
            <div className="MdrNavRight">
              <MdrButton text="Login" size="Tiny" category="Ghost" />
            </div>
          </MdrNav>
        ),
        variants: buildVariants(NAV_COLUMNS, (columns) => (
          <MdrNav columns={columns} backgroundStyle="Solid" style={{ width: 180 }}>
            <div className="MdrNavLeft">
              <MdrText size="Tiny">Brand</MdrText>
            </div>
            <div className="MdrNavRight">
              <MdrButton text={columns === 2 ? "Login" : "Start"} size="Tiny" category="Ghost" />
            </div>
          </MdrNav>
        ), (columns) => `${columns} Col`),
        scale: 0.55,
      },
      {
        id: "navbar",
        name: "Navbar",
        preview: <MdrNavbar size="Medium" brand="Mdr" items={NAVBAR_ITEMS} />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrNavbar size={(size ?? "Medium") as "Small" | "Medium" | "Large"} brand="Mdr" items={NAVBAR_ITEMS} />
        ),
        variants: buildVariants(NAVBAR_SIZES, (size) => (
          <MdrNavbar size={size} brand="Mdr" items={NAVBAR_ITEMS} />
        )),
        scale: 0.5,
      },
      {
        id: "sidebar",
        name: "Sidebar",
        preview: <MdrSidebar title="Menu" items={SIDEBAR_ITEMS} width={160} />,
        scale: 0.5,
      },
      {
        id: "breadcrumb",
        name: "Breadcrumb",
        preview: <MdrBreadcrumb items={BREADCRUMB_ITEMS} />,
        scale: 0.7,
      },
      {
        id: "pagination",
        name: "Pagination",
        preview: <MdrPagination page={2} total={50} />,
        scale: 0.6,
      },
      {
        id: "anchor-navigation",
        name: "AnchorNav",
        preview: <MdrAnchorNavigation items={ANCHOR_ITEMS} orientation="Vertical" />,
        variants: buildVariants(["Vertical", "Horizontal"] as const, (orientation) => (
          <MdrAnchorNavigation items={ANCHOR_ITEMS} orientation={orientation} />
        )),
        scale: 0.6,
      },
      {
        id: "tabs",
        name: "Tabs",
        preview: <MdrTabs items={TAB_ITEMS} />,
        scale: 0.55,
      },
      {
        id: "collapse",
        name: "Collapse",
        preview: <MdrCollapse items={COLLAPSE_ITEMS} defaultActiveKeys={["panel-1"]} />,
        scale: 0.55,
      },
    ],
  },
  {
    id: "media",
    title: "媒体与嵌入",
    items: [
      {
        id: "image",
        name: "Image",
        preview: <MdrImage src={PLACEHOLDER_IMAGE} alt="Preview" size="Medium" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrImage src={PLACEHOLDER_IMAGE} alt="Preview" size={(size ?? "Medium") as "Small" | "Medium" | "Large"} />
        ),
        variants: buildVariants(IMAGE_SIZES, (size) => (
          <MdrImage src={PLACEHOLDER_IMAGE} alt="Preview" size={size} />
        )),
      },
      {
        id: "avatar",
        name: "Avatar",
        preview: <MdrAvatar src={PLACEHOLDER_AVATAR} size="Medium" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrAvatar src={PLACEHOLDER_AVATAR} size={(size ?? "Medium") as "Small" | "Medium" | "Large"} />
        ),
        variants: buildVariants(AVATAR_SIZES, (size) => (
          <MdrAvatar src={PLACEHOLDER_AVATAR} size={size} />
        )),
      },
      {
        id: "image-gallery",
        name: "Gallery",
        preview: <MdrImageGallery images={GALLERY_IMAGES} columns={2} gap="Small" size="Medium" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrImageGallery
            images={GALLERY_IMAGES}
            columns={2}
            gap="Small"
            size={(size ?? "Medium") as "Small" | "Medium" | "Large"}
          />
        ),
        variants: buildVariants(["Grid", "List", "Masonry"] as const, (layout) => (
          <MdrImageGallery images={GALLERY_IMAGES} columns={2} gap="Small" size="Medium" layout={layout} />
        )),
        scale: 0.55,
      },
      {
        id: "video",
        name: "Video",
        preview: <MdrVideo src="" poster={PLACEHOLDER_VIDEO} controls={false} muted />,
        variants: buildVariants(["16:9", "4:3", "1:1"] as const, (ratio) => (
          <MdrVideo src="" poster={PLACEHOLDER_VIDEO} controls={false} muted aspectRatio={ratio} />
        ), (ratio) => ratio),
        scale: 0.6,
      },
      {
        id: "audio",
        name: "Audio",
        preview: <MdrAudio src="" controls />,
        scale: 0.6,
      },
      {
        id: "iframe",
        name: "Iframe",
        preview: <MdrIframe src="about:blank" srcDoc={PLACEHOLDER_IFRAME} title="Preview" />,
        variants: buildVariants(["16:9", "4:3", "1:1"] as const, (ratio) => (
          <MdrIframe src="about:blank" srcDoc={PLACEHOLDER_IFRAME} title="Preview" aspectRatio={ratio} />
        ), (ratio) => ratio),
        scale: 0.55,
      },
      {
        id: "embed",
        name: "Embed",
        preview: <MdrEmbed type="Custom" url={EMBED_PLACEHOLDER_URL} />,
        variants: buildVariants(["16:9", "4:3", "1:1"] as const, (ratio) => (
          <MdrEmbed type="Custom" url={EMBED_PLACEHOLDER_URL} aspectRatio={ratio} />
        ), (ratio) => ratio),
        scale: 0.55,
      },
    ],
  },
  {
    id: "data",
    title: "数据展示",
    items: [
      {
        id: "table",
        name: "Table",
        preview: <MdrTable data={TABLE_DATA} columns={TABLE_COLUMNS} size="Medium" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrTable
            data={TABLE_DATA}
            columns={TABLE_COLUMNS}
            size={(size ?? "Medium") as "Small" | "Medium" | "Large"}
          />
        ),
        variants: buildVariants(TABLE_SIZES, (size) => (
          <MdrTable data={TABLE_DATA} columns={TABLE_COLUMNS} size={size} />
        )),
        scale: 0.48,
      },
      {
        id: "data-grid",
        name: "DataGrid",
        preview: <MdrDataGrid data={GRID_DATA} columns={GRID_COLUMNS} />,
        scale: 0.5,
      },
      {
        id: "list",
        name: "List",
        preview: <MdrList items={LIST_ITEMS} size="Medium" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrList items={LIST_ITEMS} size={(size ?? "Medium") as "Small" | "Medium" | "Large"} />
        ),
        variants: buildVariants(LIST_SIZES, (size) => (
          <MdrList items={LIST_ITEMS} size={size} />
        )),
        scale: 0.55,
      },
      {
        id: "check-list",
        name: "CheckList",
        preview: <MdrCheckList items={CHECKLIST_ITEMS} defaultValue={["wireframes"]} />,
        scale: 0.6,
      },
      {
        id: "tree",
        name: "Tree",
        preview: <MdrTree data={TREE_DATA} defaultExpandedKeys={["root"]} />,
        scale: 0.55,
      },
      {
        id: "tree-select",
        name: "TreeSelect",
        preview: <MdrTreeSelect options={TREE_SELECT_OPTIONS} defaultValue="option-1" />,
        scale: 0.6,
      },
      {
        id: "tag",
        name: "Tag",
        preview: <MdrTag text="Tag" size="Medium" variant="Soft" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrTag text="Tag" size={(size ?? "Medium") as "Small" | "Medium" | "Large"} variant="Soft" />
        ),
        variants: buildVariants(TAG_VARIANTS, (variant) => (
          <MdrTag text={variant} size="Medium" variant={variant} />
        )),
        scale: 0.7,
      },
      {
        id: "badge",
        name: "Badge",
        preview: (
          <MdrBadge count={3}>
            <MdrIcon icon={Sparkles} size={16} />
          </MdrBadge>
        ),
        scale: 0.8,
      },
      {
        id: "progress",
        name: "Progress",
        preview: <MdrProgress value={62} size="Medium" />,
        sizeOptions: SIZE_OPTIONS,
        statusOptions: PROGRESS_STATUSES.map((status) => ({ id: status, label: status, value: status })),
        defaultStatus: "Default",
        renderPreview: ({ size, status }) => (
          <MdrProgress
            value={62}
            size={(size ?? "Medium") as "Small" | "Medium" | "Large"}
            status={(status ?? "Default") as "Default" | "Success" | "Warning" | "Danger"}
          />
        ),
        variants: buildVariants(PROGRESS_STATUSES, (status) => (
          <MdrProgress value={62} size="Medium" status={status} />
        )),
        scale: 0.6,
      },
      {
        id: "spinner",
        name: "Spinner",
        preview: <MdrSpinner size="Medium" label="Loading" />,
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrSpinner size={(size ?? "Medium") as "Small" | "Medium" | "Large"} label="Loading" />
        ),
        variants: buildVariants(SPINNER_SIZES, (size) => (
          <MdrSpinner size={size} label="Loading" />
        )),
        scale: 0.75,
      },
      {
        id: "statistic",
        name: "Statistic",
        preview: <MdrStatistic title="Total" value={248} trend="Up" />,
        scale: 0.6,
      },
      {
        id: "timeline",
        name: "Timeline",
        preview: <MdrTimeline items={TIMELINE_ITEMS} />,
        scale: 0.55,
      },
      {
        id: "steps",
        name: "Steps",
        preview: <MdrSteps items={STEPS_ITEMS} current={1} />,
        variants: buildVariants(STEPS_DIRECTIONS, (direction) => (
          <MdrSteps items={STEPS_ITEMS} current={1} direction={direction} />
        )),
        scale: 0.5,
      },
    ],
  },
  {
    id: "feedback",
    title: "反馈组件",
    items: [
      {
        id: "modal",
        name: "Modal",
        preview: (
          <MdrModal
            open
            size="Medium"
            title="Modal"
            footer={<MdrButton text="OK" size="Tiny" category="Primary" />}
          >
            <MdrText size="Tiny">Details</MdrText>
          </MdrModal>
        ),
        sizeOptions: SIZE_OPTIONS,
        renderPreview: ({ size }) => (
          <MdrModal
            open
            size={(size ?? "Medium") as "Small" | "Medium" | "Large"}
            title="Modal"
            footer={<MdrButton text="OK" size="Tiny" category="Primary" />}
          >
            <MdrText size="Tiny">Details</MdrText>
          </MdrModal>
        ),
        variants: buildVariants(MODAL_SIZES, (size) => (
          <MdrModal
            open
            size={size}
            title="Modal"
            footer={<MdrButton text="OK" size="Tiny" category="Primary" />}
          >
            <MdrText size="Tiny">Details</MdrText>
          </MdrModal>
        )),
        scale: 0.45,
      },
      {
        id: "drawer",
        name: "Drawer",
        preview: (
          <MdrDrawer open placement="Right" size={160} title="Drawer">
            <MdrText size="Tiny">Content</MdrText>
          </MdrDrawer>
        ),
        variants: buildVariants(DRAWER_PLACEMENTS, (placement) => (
          <MdrDrawer open placement={placement} size={140} title="Drawer">
            <MdrText size="Tiny">Content</MdrText>
          </MdrDrawer>
        )),
        scale: 0.45,
      },
      {
        id: "tooltip",
        name: "Tooltip",
        preview: (
          <MdrTooltip content="Tooltip" placement="Top">
            <MdrButton text="Hover" size="Tiny" category="Secondary" />
          </MdrTooltip>
        ),
        variants: buildVariants(TOOLTIP_PLACEMENTS, (placement) => (
          <MdrTooltip content={placement} placement={placement}>
            <MdrButton text="Hover" size="Tiny" category="Secondary" />
          </MdrTooltip>
        )),
        scale: 0.8,
      },
      {
        id: "popover",
        name: "Popover",
        preview: (
          <MdrPopover title="Popover" content="Details" defaultOpen>
            <MdrButton text="More" size="Tiny" category="Secondary" />
          </MdrPopover>
        ),
        scale: 0.8,
      },
      {
        id: "message",
        name: "Message",
        preview: <MdrMessage text="Saved" type="Success" />,
        statusOptions: MESSAGE_TYPES.map((status) => ({ id: status, label: status, value: status })),
        defaultStatus: "Success",
        renderPreview: ({ status }) => (
          <MdrMessage text="Saved" type={(status ?? "Success") as "Info" | "Success" | "Warning" | "Danger"} />
        ),
        variants: buildVariants(MESSAGE_TYPES, (type) => (
          <MdrMessage text={type} type={type} />
        )),
        scale: 0.8,
      },
      {
        id: "notification",
        name: "Notification",
        preview: <MdrNotification title="Update" description="Latest changes" type="Info" />,
        statusOptions: NOTIFICATION_TYPES.map((status) => ({ id: status, label: status, value: status })),
        defaultStatus: "Info",
        renderPreview: ({ status }) => (
          <MdrNotification
            title="Update"
            description="Latest changes"
            type={(status ?? "Info") as "Info" | "Success" | "Warning" | "Danger"}
          />
        ),
        variants: buildVariants(NOTIFICATION_TYPES, (type) => (
          <MdrNotification title={type} description="Latest changes" type={type} />
        )),
        scale: 0.6,
      },
      {
        id: "empty",
        name: "Empty",
        preview: <MdrEmpty title="No data" description="Nothing here" />,
        scale: 0.7,
      },
      {
        id: "skeleton",
        name: "Skeleton",
        preview: <MdrSkeleton variant="Text" lines={2} />,
        variants: buildVariants(SKELETON_VARIANTS, (variant) => (
          <MdrSkeleton variant={variant} lines={variant === "Text" ? 2 : 1} />
        )),
        scale: 0.8,
      },
    ],
  },
]
