import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { MdrButton, MdrHeading, MdrInput, MdrMessage, MdrPanel, MdrParagraph, MdrTabs } from "@mdr/ui"
import { authApi, ApiError } from "./authApi"
import { useAuthStore } from "./useAuthStore"
import "./AuthPage.scss"

type AuthMode = "login" | "register"

const formatError = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return "Something went wrong. Please try again."
}

export const AuthPage = () => {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [mode, setMode] = useState<AuthMode>("login")
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    description: "",
  })

  const loginDisabled = isLoading || !loginForm.email.trim() || !loginForm.password.trim()
  const registerDisabled =
    isLoading ||
    !registerForm.name.trim() ||
    !registerForm.email.trim() ||
    registerForm.password.trim().length < 8

  const tabs = useMemo(
    () => [
      {
        key: "login",
        label: t("tabs.login"),
        content: (
          <div className="AuthForm">
            <label className="AuthField">
              <span>{t("fields.email")}</span>
              <MdrInput
                size="Small"
                type="Email"
                autoComplete="email"
                value={loginForm.email}
                placeholder={t("placeholders.email")}
                onChange={(value) => setLoginForm((prev) => ({ ...prev, email: value }))}
              />
            </label>
            <label className="AuthField">
              <span>{t("fields.password")}</span>
              <MdrInput
                size="Small"
                type="Password"
                autoComplete="current-password"
                value={loginForm.password}
                placeholder={t("placeholders.password")}
                onChange={(value) => setLoginForm((prev) => ({ ...prev, password: value }))}
              />
            </label>
            <MdrButton
              text={t("actions.login")}
              size="Small"
              category="Primary"
              disabled={loginDisabled}
              onClick={async () => {
                setError(null)
                setLoading(true)
                try {
                  const response = await authApi.login({
                    email: loginForm.email.trim(),
                    password: loginForm.password,
                  })
                  setSession(response.token, response.user, response.expiresAt)
                  navigate("/profile")
                } catch (err) {
                  setError(formatError(err))
                } finally {
                  setLoading(false)
                }
              }}
            />
          </div>
        ),
      },
      {
        key: "register",
        label: t("tabs.register"),
        content: (
          <div className="AuthForm">
            <label className="AuthField">
              <span>{t("fields.name")}</span>
              <MdrInput
                size="Small"
                autoComplete="name"
                value={registerForm.name}
                placeholder={t("placeholders.name")}
                onChange={(value) => setRegisterForm((prev) => ({ ...prev, name: value }))}
              />
            </label>
            <label className="AuthField">
              <span>{t("fields.description")}</span>
              <MdrInput
                size="Small"
                value={registerForm.description}
                placeholder={t("placeholders.description")}
                onChange={(value) => setRegisterForm((prev) => ({ ...prev, description: value }))}
              />
            </label>
            <label className="AuthField">
              <span>{t("fields.email")}</span>
              <MdrInput
                size="Small"
                type="Email"
                autoComplete="email"
                value={registerForm.email}
                placeholder={t("placeholders.email")}
                onChange={(value) => setRegisterForm((prev) => ({ ...prev, email: value }))}
              />
            </label>
            <label className="AuthField">
              <span>{t("fields.password")}</span>
              <MdrInput
                size="Small"
                type="Password"
                autoComplete="new-password"
                value={registerForm.password}
                placeholder={t("placeholders.password")}
                onChange={(value) => setRegisterForm((prev) => ({ ...prev, password: value }))}
              />
              <em>{t("hints.password")}</em>
            </label>
            <MdrButton
              text={t("actions.register")}
              size="Small"
              category="Primary"
              disabled={registerDisabled}
              onClick={async () => {
                setError(null)
                setLoading(true)
                try {
                  const response = await authApi.register({
                    name: registerForm.name.trim(),
                    email: registerForm.email.trim(),
                    password: registerForm.password,
                    description: registerForm.description.trim(),
                  })
                  setSession(response.token, response.user, response.expiresAt)
                  navigate("/profile")
                } catch (err) {
                  setError(formatError(err))
                } finally {
                  setLoading(false)
                }
              }}
            />
          </div>
        ),
      },
    ],
    [loginDisabled, registerDisabled, loginForm, registerForm, navigate, setSession, t]
  )

  return (
    <div className="AuthPage">
      <section className="AuthPageHero">
        <MdrHeading level={2}>{t("title")}</MdrHeading>
        <MdrParagraph color="Muted">{t("subtitle")}</MdrParagraph>
        <div className="AuthHeroHighlights">
          <div>
            <span className="AuthHeroLabel">{t("highlights.speedTitle")}</span>
            <p>{t("highlights.speedBody")}</p>
          </div>
          <div>
            <span className="AuthHeroLabel">{t("highlights.workspaceTitle")}</span>
            <p>{t("highlights.workspaceBody")}</p>
          </div>
        </div>
      </section>
      <section className="AuthPageCard">
        <MdrPanel title={t("panel.title")} padding="Large" className="AuthPanel">
          {error && <MdrMessage type="Danger" text={error} />}
          <MdrTabs
            items={tabs}
            activeKey={mode}
            onChange={(key) => {
              setMode(key as AuthMode)
              setError(null)
            }}
          />
          <div className="AuthFooter">
            <span>{t("footer.hint")}</span>
            <MdrButton
              text={t("footer.backHome")}
              size="Small"
              category="Ghost"
              onClick={() => navigate("/")}
            />
          </div>
        </MdrPanel>
      </section>
    </div>
  )
}
