# Inspector Layout Grid System

## Context

Inspector 后续还需要做布局层面的优化。除了 Panel 标题之外，Inspector 内部的字段行、图标按钮、输入框、分段控件和组合控件都应落在统一的度量系统上，形成类似 Figma / Framer / Dify 等主流设计工具的网格对齐效果。

当前实现中存在若干不统一现象：

- 普通输入、UnitInput、ColorInput、IconButtonGroup 的高度不完全一致。
- 某些控件使用 `max-w-[100px]`、`w-9`、`min-w-15` 等临时宽度，缺少统一倍数关系。
- GridGroup 中的按钮布局与 FlexGroup 不一致，视觉上更像表单拼装而不是专业属性面板。
- `InspectorRow` 只负责 label/control 的粗略排列，没有强制行高、列宽、控件尺寸。

本规格用于定义 Inspector 内部的布局测量系统。它不改变 Panel 架构本身，也不要求 Panel 标题图标化。

## Goals

1. 除 Panel 标题之外，Inspector 字段行使用统一行高。
2. 字段行内所有核心元素宽度使用固定单位的整数倍。
3. 让 Style Tab 尤其是 Layout / Flex / Grid 控件呈现明显的网格对齐效果。
4. 建立可复用的 inspector layout token，避免在业务组件中继续散落临时尺寸。
5. 保持 monochrome-ui 风格，避免过度装饰。

## Non Goals

1. 不重做 Panel 标题结构。
2. 不要求所有字段都变成图标。
3. 不修改 MIR 数据结构。
4. 不把这些布局 token 放进 `packages/ui`。
5. 不在本规格中处理图标绘制细节，图标资产见 `inspector-style-icon-assets-plan.md`。

## Measurement Tokens

Inspector 应建立自己的局部 token。建议先用常量或 CSS custom properties 表达，后续再视情况收敛到主题系统。

```css
:root {
  --inspector-unit: 4px;
  --inspector-column-unit: 8px;
  --inspector-row-height: 32px;
  --inspector-control-height: 28px;
  --inspector-icon-cell: 24px;
  --inspector-icon-size: 16px;
  --inspector-label-width: 96px;
  --inspector-field-gap: 8px;
  --inspector-control-min: 96px;
  --inspector-control-sm: 128px;
  --inspector-control-md: 160px;
  --inspector-control-lg: 192px;
}
```

规则：

- 基础单位为 `4px`。
- 宽度优先按 `8px` 的整数倍分配。
- 行高优先为 `32px`，复杂字段可以占用多个 `32px` 行单元。
- 普通控件高度为 `28px`，在 `32px` 行内容器中垂直居中。
- 图标按钮点击区域为 `24px`，图标 glyph 为 `16px`。

## Row Rules

### Standard Row

标准字段行：

```text
row height: 32px
label width: 96px
gap: 8px
control area: remaining width
control height: 28px
```

适用：

- 文本输入
- select
- checkbox/toggle 行
- color input 单行模式
- width / height / gap / radius 等单值字段

### Multi-Line Row

当字段需要描述文本、富文本编辑器、class protocol editor、trigger item 等复杂内容时，不再强行塞进单行，但外层高度必须仍然按 `32px` 行单元增长：

```text
height = 32px * n
vertical gap = 8px
```

适用：

- `layout="vertical"` 的 `InspectorRow`
- rich text editor
- ClassProtocolEditor
- TriggerItem
- External Props 列表

### Panel Title Exception

Panel 标题不纳入字段行高系统。

原因：

- Panel 标题承担分区识别和折叠控制。
- 标题区可以有独立的 sticky / header action 规则。
- 字段行网格应从 Panel body 开始计算。

## Width Rules

所有核心子元素宽度必须是 `8px` 的整数倍。

| Element             | Width                                    |
| ------------------- | ---------------------------------------- |
| label column        | `96px`                                   |
| row gap             | `8px`                                    |
| icon button cell    | `24px`                                   |
| icon glyph          | `16px`                                   |
| small numeric input | `64px`                                   |
| unit input          | `96px`                                   |
| compact select      | `96px` or `128px`                        |
| normal input        | `160px`                                  |
| long input          | `192px`                                  |
| color swatch        | `24px`                                   |
| 2-column field cell | `(available - 8px) / 2`, rounded to grid |

Avoid:

- `w-9`
- `min-w-15`
- `max-w-[100px]`
- arbitrary values that are not aligned to 4px / 8px grid

Exception:

- Borders can remain `1px`.
- Divider lines can remain `1px`.
- Canvas-like preview content can use its own aspect ratio.

## InspectorRow Contract

`InspectorRow` should become the main alignment primitive.

Recommended props:

```ts
type InspectorRowProps = {
  label: React.ReactNode;
  description?: React.ReactNode;
  control: React.ReactNode;
  layout?: 'horizontal' | 'vertical';
  controlWidth?: 'sm' | 'md' | 'lg' | 'full';
  rowSpan?: 1 | 2 | 3 | 'auto';
};
```

Behavior:

- `horizontal` rows use `min-height: var(--inspector-row-height)`.
- `horizontal` rows align label and control to the same baseline grid.
- `vertical` rows use `gap: 8px` and consume full width.
- `description` pushes the row into multi-line mode instead of disturbing single-line row height.
- Control width should be chosen from token values, not arbitrary Tailwind widths.

## Control Rules

### Text Inputs / Selects

- Height: `28px`.
- Width: token driven.
- Text should vertically center within the control.
- Numeric fields should use tabular numbers.

### UnitInput

Target size:

```text
width: 96px
height: 28px
amount area: 48px
unit area: 40px
divider: 1px
padding / border included in component box
```

The current `max-w-[100px]` should be removed.

### ColorInput

Target size:

```text
full component width: 192px
input width: 160px
swatch cell: 24px
gap: 8px
height: 28px
```

The current `w-9` swatch should be changed to `24px`.

### IconButtonGroup

Icon layout controls should favor dense grid buttons without visible text when the icon is precise enough.

Target:

```text
button height: 28px
button min width: 32px or 40px
icon cell: 24px
gap: 4px / 8px
```

Rules:

- Flex direction can use a `2x2` grid.
- Justify / align groups can use same-size icon cells.
- Grid groups must not use text abbreviations as icons.
- Labels remain in `title` / `aria-label`; visible text is optional and should be avoided for high-density icon controls.

## Layout Tab Specific Rules

### Display Selector

Display mode should be a compact segmented control:

```text
Block | Flex | Grid | None
```

Each segment:

- fixed width: `40px` or `48px`
- height: `28px`
- icon centered
- label in `title`

### Spacing

Margin / Padding controls should align to a box model grid.

Rules:

- outer box dimensions should be multiples of `8px`
- side inputs should share the same width
- center input should align on the same x/y grid as side inputs
- collapsed row should still consume `32px`

### Size

Width / Height should use a two-column grid:

```text
column gap: 8px
each column control height: 28px
```

Column widths should be equal and derive from available width.

### Flex

Flex controls should use icon-only buttons when possible:

- direction: 2x2 grid
- justify: 6 equal cells
- align: 5 equal cells

When `flex-direction` changes from row-like to column-like, icons should change orientation but button dimensions must not change.

### Grid

Grid controls should be more explicit than Flex:

- `auto-flow`: 2x2 grid
- `justify-items` / `align-items`: item-in-cell icons
- `justify-content` / `align-content`: whole-grid-in-container icons

All grid option buttons in one group must share width and height.

## Implementation Plan

1. Add local inspector sizing tokens.
2. Refactor `InspectorRow` to enforce row height, label width, and control width modes.
3. Refactor `IconButtonGroup` to support icon-only dense mode and fixed cell sizes.
4. Normalize `UnitInput` to `96px x 28px`.
5. Normalize `ColorInput` to `192px x 28px` with `24px` swatch.
6. Apply the row/grid system to LayoutPanel groups.
7. Replace GridGroup text placeholders with icons from `@/assets/icons`.
8. Audit arbitrary width classes in Inspector and replace them with token-based sizes.

## Acceptance Criteria

- All standard Inspector field rows have a consistent `32px` visual row rhythm.
- Common controls inside rows have a consistent `28px` height.
- Label column width is consistent across horizontal rows.
- Icon buttons use consistent `24px` cells and `16px` glyphs.
- UnitInput, ColorInput, IconButtonGroup widths are token-based.
- Grid/Flex option buttons do not resize when selected or when values change.
- GridGroup no longer uses letters as visual icons.
- Arbitrary widths in Inspector are either removed or documented as justified exceptions.
