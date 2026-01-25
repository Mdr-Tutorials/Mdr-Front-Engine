import { MdrButton, MdrInput } from "@mdr/ui"
import { Link2, Plus } from "lucide-react"
import type { RouteItem } from "./BlueprintEditor.types"

type BlueprintEditorAddressBarProps = {
  currentPath: string
  newPath: string
  routes: RouteItem[]
  onCurrentPathChange: (value: string) => void
  onNewPathChange: (value: string) => void
  onAddRoute: () => void
}

export function BlueprintEditorAddressBar({
  currentPath,
  newPath,
  routes,
  onCurrentPathChange,
  onNewPathChange,
  onAddRoute,
}: BlueprintEditorAddressBarProps) {
  return (
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
          onChange={onCurrentPathChange}
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
          onChange={onNewPathChange}
        />
        <MdrButton
          text="添加"
          size="Tiny"
          category="Ghost"
          onClick={onAddRoute}
        />
      </div>
      <div className="AddressInlineGroup AddressSelect">
        <span className="AddressLabelInline">地址列表</span>
        <select
          className="AddressSelectControl"
          value={currentPath}
          onChange={(event) => onCurrentPathChange(event.target.value)}
        >
          {routes.map((route) => (
            <option key={route.id} value={route.path}>
              {route.path}
            </option>
          ))}
        </select>
      </div>
    </section>
  )
}
