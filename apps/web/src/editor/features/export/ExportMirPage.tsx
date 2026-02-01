import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useEditorStore } from "@/editor/store/useEditorStore"
import { CodeViewer } from "./CodeViewer"
import "./ExportMirPage.scss"

export function ExportMirPage() {
  const { t } = useTranslation("export")
  const mirDoc = useEditorStore((state) => state.mirDoc)
  const [copied, setCopied] = useState(false)

  const mirJson = useMemo(() => {
    if (!mirDoc) return ""
    return JSON.stringify(mirDoc, null, 2)
  }, [mirDoc])

  return (
    <div className="ExportMirPage">
      <div className="ExportMirPageHeader">
        <div className="ExportMirPageTitle">
          <h1>{t("mir.title", { defaultValue: "MIR" })}</h1>
          <p>{t("mir.description", { defaultValue: "当前项目的 MIR JSON（临时页）" })}</p>
        </div>
        <button
          type="button"
          className="ExportMirPageCopy"
          disabled={!mirJson}
          onClick={async () => {
            if (!mirJson) return
            await navigator.clipboard.writeText(mirJson)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 900)
          }}
        >
          {copied ? t("copySuccess", { defaultValue: "已复制" }) : t("copy", { defaultValue: "复制" })}
        </button>
      </div>

      <div className="ExportMirPageBody">
        {mirJson ? (
          <CodeViewer code={mirJson} lang="json" />
        ) : (
          <div className="ExportMirPageEmpty">
            {t("mir.empty", { defaultValue: "暂无 MIR（先进入蓝图编辑器创建组件）" })}
          </div>
        )}
      </div>
    </div>
  )
}

