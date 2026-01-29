import { useTranslation } from 'react-i18next'

export function ProjectResources() {
  const { t } = useTranslation('routes')

  return <div>{t('resourceManager')}</div>
}
