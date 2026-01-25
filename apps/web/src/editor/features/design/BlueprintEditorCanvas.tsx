import { useTranslation } from "react-i18next"

export function BlueprintEditorCanvas() {
  const { t } = useTranslation('blueprint')

  return (
    <section className="BlueprintEditorCanvas">
      <div className="BlueprintEditorCanvasSurface">
        <div className="BlueprintEditorCanvasGrid" />
        <div className="BlueprintEditorCanvasPlaceholder">
          <h3>{t('canvas.placeholderTitle')}</h3>
          <p>{t('canvas.placeholderDescription')}</p>
        </div>
      </div>
    </section>
  )
}
