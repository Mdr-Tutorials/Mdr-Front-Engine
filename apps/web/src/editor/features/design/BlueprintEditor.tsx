import { useMemo, useState } from "react"
import { MdrButton, MdrInput } from "@mdr/ui"
import { ChevronDown, ChevronLeft, ChevronRight, Link2, Plus } from "lucide-react"
import "./BlueprintEditor.scss"

type RouteItem = {
  id: string
  path: string
}

type ComponentGroup = {
  title: string
  items: string[]
}

const DEFAULT_ROUTES: RouteItem[] = [
  { id: "home", path: "/" },
  { id: "product", path: "/product/:id" },
  { id: "search", path: "/search?q=:keyword" },
]

const VIEWPORT_PRESETS = [
  { label: "1440×900", width: "1440", height: "900" },
  { label: "1280×720", width: "1280", height: "720" },
  { label: "1024×768", width: "1024", height: "768" },
  { label: "768×1024", width: "768", height: "1024" },
  { label: "390×844", width: "390", height: "844" },
  { label: "375×812", width: "375", height: "812" },
]

const COMPONENT_LIBRARY: ComponentGroup[] = [
  {
    title: "基础组件",
    items: [
      "Text",
      "Heading",
      "Paragraph",
      "Button",
      "IconButton",
      "ButtonGroup",
      "Input",
      "Textarea",
      "Search",
      "Div",
      "Section",
      "Card",
      "Panel",
      "Image",
      "Avatar",
      "ImageGallery",
      "Link",
      "Anchor",
      "Video",
      "Audio",
      "Iframe",
      "Embed",
    ],
  },
  {
    title: "智能表单",
    items: [
      "DatePicker",
      "DateRangePicker",
      "TimePicker",
      "省市区三级联动",
      "验证码输入",
      "密码强度",
      "Regex 验证输入",
      "File",
      "ImageUpload",
      "RichTextEditor",
      "Rating",
      "ColorPicker",
      "Slider/Range",
    ],
  },
  {
    title: "媒体组件",
    items: [
      "轮播图",
      "赞助商 Logo 轮播",
      "图片瀑布流",
      "VideoBackground",
      "ModelViewer",
    ],
  },
  {
    title: "可编程画布",
    items: ["Canvas 2D", "WebGL", "WebGPU"],
  },
  {
    title: "图表组件",
    items: ["折线图", "柱状图", "饼图", "雷达图", "实时数据流图表", "地图组件"],
  },
  {
    title: "导航组件",
    items: [
      "Navbar",
      "Sidebar",
      "Breadcrumb",
      "Pagination",
      "Anchor Navigation",
      "Tabs",
      "Collapse",
      "Accordion",
    ],
  },
  {
    title: "反馈组件",
    items: ["Modal", "Drawer", "Tooltip", "Popover", "Message", "Notification", "Empty", "Skeleton"],
  },
]

const createRouteId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `route-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function BlueprintEditor() {
  const [routes, setRoutes] = useState<RouteItem[]>(DEFAULT_ROUTES)
  const [currentPath, setCurrentPath] = useState(DEFAULT_ROUTES[0].path)
  const [newPath, setNewPath] = useState("")
  const [isLibraryCollapsed, setLibraryCollapsed] = useState(false)
  const [isInspectorCollapsed, setInspectorCollapsed] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [viewportWidth, setViewportWidth] = useState("1440")
  const [viewportHeight, setViewportHeight] = useState("900")

  const routeList = useMemo(() => routes, [routes])

  const handleAddRoute = () => {
    const value = newPath.trim()
    if (!value) return
    const next = { id: createRouteId(), path: value }
    setRoutes((prev) => [...prev, next])
    setCurrentPath(value)
    setNewPath("")
  }

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <div className="BlueprintEditor">
      <section className="BlueprintEditorAddressBar">
        <div className="AddressInlineGroup">
          <span className="AddressLabelInline">
            <Link2 size={14} />
            当前
          </span>
          <MdrInput
            placeholder="/page/:id?tab=:tab"
            value={currentPath}
            size="Small"
            className="AddressInput AddressCurrentInput"
            onChange={setCurrentPath}
          />
        </div>
        <div className="AddressInlineGroup">
          <span className="AddressLabelInline">
            <Plus size={14} />
            新建
          </span>
          <MdrInput
            placeholder="/new-route/:slug"
            value={newPath}
            size="Small"
            className="AddressInput AddressNewInput"
            onChange={setNewPath}
          />
          <MdrButton
            text="添加"
            size="Tiny"
            category="Ghost"
            onClick={handleAddRoute}
          />
        </div>
        <div className="AddressInlineGroup AddressSelect">
          <span className="AddressLabelInline">地址列表</span>
          <select
            className="AddressSelectControl"
            value={currentPath}
            onChange={(event) => setCurrentPath(event.target.value)}
          >
            {routeList.map((route) => (
              <option key={route.id} value={route.path}>
                {route.path}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div
        className={`BlueprintEditorBody ${isLibraryCollapsed ? "SidebarCollapsed" : ""} ${isInspectorCollapsed ? "InspectorCollapsed" : ""}`}
      >
        <aside className={`BlueprintEditorSidebar ${isLibraryCollapsed ? "Collapsed" : ""}`}>
          <div className="BlueprintEditorSidebarHeader">
            <span>组件库</span>
            <button
              className="BlueprintEditorCollapse"
              onClick={() => setLibraryCollapsed((prev) => !prev)}
              aria-label="Toggle component library"
            >
              {isLibraryCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          {!isLibraryCollapsed && (
            <div className="BlueprintEditorComponentList">
              {COMPONENT_LIBRARY.map((group) => (
                <div key={group.title} className="ComponentGroup">
                  <button className="ComponentGroupHeader" onClick={() => toggleGroup(group.title)}>
                    <span className="ComponentGroupTitle">{group.title}</span>
                    <ChevronDown
                      size={14}
                      className={`ComponentGroupIcon ${collapsedGroups[group.title] ? "Collapsed" : ""}`}
                    />
                  </button>
                  {!collapsedGroups[group.title] && (
                    <div className="ComponentGroupItems">
                      {group.items.map((item) => (
                        <span key={item} className="ComponentChip">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>

        <section className="BlueprintEditorCanvas">
          <div className="BlueprintEditorCanvasSurface">
            <div className="BlueprintEditorCanvasGrid" />
            <div className="BlueprintEditorCanvasPlaceholder">
              <h3>拖拽组件到画布开始构建蓝图</h3>
              <p>支持拖拽、吸附、对齐与多选。画布区域暂为占位。</p>
            </div>
          </div>
          <div className="BlueprintEditorCanvasFooter">
            <div className="ViewportLabel">视口</div>
            <div className="ViewportInputs">
              <MdrInput size="Small" value={viewportWidth} onChange={setViewportWidth} />
              <span>×</span>
              <MdrInput size="Small" value={viewportHeight} onChange={setViewportHeight} />
            </div>
            <div className="ViewportPresets">
              {VIEWPORT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className="ViewportPreset"
                  onClick={() => {
                    setViewportWidth(preset.width)
                    setViewportHeight(preset.height)
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className={`BlueprintEditorInspector ${isInspectorCollapsed ? "Collapsed" : ""}`}>
          <div className="InspectorHeader">
            <span>对象设置</span>
            <button
              className="BlueprintEditorCollapse"
              onClick={() => setInspectorCollapsed((prev) => !prev)}
              aria-label="Toggle inspector"
            >
              {isInspectorCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
          {!isInspectorCollapsed && (
            <div className="InspectorPlaceholder">
              <p>选择蓝图中的对象以查看详细配置。</p>
              <div className="InspectorSkeleton">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default BlueprintEditor
