"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { AlertTriangle, Check, Info } from "lucide-react"

import { MultiStepForm } from "@/components/ui/multi-step-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAppStore } from "@/store/useAppStore"

/* ─── Types ─── */

interface FormData {
  age: string
  employment_status: string
  num_dependents: string
  location_type: string
  digital_savviness: number
  has_bank_account: number
  has_ewallet: number
  monthly_income: string
  monthly_expenses: string
  existing_savings: string
  savings_goal: string
  risk_tolerance: string
  investment_horizon: string
}

const initialFormData: FormData = {
  age: "",
  employment_status: "",
  num_dependents: "0",
  location_type: "",
  digital_savviness: 3,
  has_bank_account: 0,
  has_ewallet: 0,
  monthly_income: "",
  monthly_expenses: "",
  existing_savings: "",
  savings_goal: "",
  risk_tolerance: "",
  investment_horizon: "",
}

const savvinessLabels: Record<number, string> = {
  1: "Beginner",
  2: "Basic",
  3: "Comfortable",
  4: "Proficient",
  5: "Expert",
}

/* ─── Reusable helpers ─── */

function TooltipIcon({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function FieldLabel({
  children,
  tooltip,
}: {
  children: React.ReactNode
  tooltip?: string
}) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <Label className="text-sm font-medium">{children}</Label>
      {tooltip && <TooltipIcon text={tooltip} />}
    </div>
  )
}

function CurrencyInput({
  label,
  tooltip,
  placeholder,
  value,
  onChange,
}: {
  label: string
  tooltip: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <FieldLabel tooltip={tooltip}>{label}</FieldLabel>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          ₱
        </span>
        <Input
          className="pl-7"
          type="number"
          placeholder={placeholder}
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

function ToggleSwitch({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const on = value === 1
  return (
    <div
      onClick={() => onChange(on ? 0 : 1)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s ease, border-color 0.2s ease",
        background: on ? "var(--primary)" : "var(--muted)",
        border: `1px solid ${on ? "var(--primary)" : "var(--border)"}`,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          left: on ? "calc(100% - 21px)" : 3,
          transition: "left 0.2s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </div>
  )
}

/* ─── Main component ─── */

export default function ProfileForm() {
  const [currentStep, setCurrentStep] = React.useState(1)
  const totalSteps = 3
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState<FormData>({
    ...initialFormData,
  })

  const { setResult } = useAppStore()
  const router = useRouter()

  const update = (field: keyof FormData, value: string | number) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.age !== "" &&
          Number(formData.age) >= 18 &&
          Number(formData.age) <= 65 &&
          formData.employment_status !== "" &&
          formData.location_type !== ""
        )
      case 2:
        return (
          formData.monthly_income !== "" &&
          Number(formData.monthly_income) >= 0 &&
          formData.monthly_expenses !== "" &&
          Number(formData.monthly_expenses) >= 0 &&
          formData.existing_savings !== "" &&
          Number(formData.existing_savings) >= 0
        )
      case 3:
        return (
          formData.savings_goal !== "" &&
          formData.risk_tolerance !== "" &&
          formData.investment_horizon !== ""
        )
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    if (!isStepValid()) return
    setIsSubmitting(true)
    try {
      const payload = {
        age: Number(formData.age),
        monthly_income: Number(formData.monthly_income),
        monthly_expenses: Number(formData.monthly_expenses),
        existing_savings: Number(formData.existing_savings),
        employment_status: formData.employment_status,
        num_dependents: Number(formData.num_dependents),
        location_type: formData.location_type,
        digital_savviness: formData.digital_savviness,
        has_bank_account: formData.has_bank_account,
        has_ewallet: formData.has_ewallet,
        savings_goal: formData.savings_goal,
        risk_tolerance: formData.risk_tolerance,
        investment_horizon: formData.investment_horizon,
      }

      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        setResult(data)
        router.push("/results")
      } else {
        setIsSubmitting(false)
        if (res.status === 422) {
          toast.error("Some inputs are invalid. Please check your answers.")
        } else if (res.status === 500) {
          toast.error("The model encountered an error. Please try again.")
        } else {
          toast.error(
            "Cannot reach the server. Make sure the backend is running.",
          )
        }
      }
    } catch {
      setIsSubmitting(false)
      toast.error(
        "Cannot reach the server. Make sure the backend is running.",
      )
    }
  }

  const handleNext = () => {
    if (!isStepValid()) return
    if (currentStep < totalSteps) setCurrentStep((prev) => prev + 1)
    else handleSubmit()
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1)
  }

  const surplus =
    Number(formData.monthly_income) - Number(formData.monthly_expenses)
  const showSurplus =
    Number(formData.monthly_income) > 0 &&
    Number(formData.monthly_expenses) > 0

  const stepMeta = [
    {
      title: "About you",
      description: "Basic information to personalize your recommendation",
    },
    {
      title: "Your finances",
      description: "Help us understand your current financial situation",
    },
    {
      title: "Your goals",
      description:
        "Tell us what you're saving for and how you invest",
    },
  ]

  return (
    <MultiStepForm
      title={stepMeta[currentStep - 1].title}
      description={stepMeta[currentStep - 1].description}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={handleNext}
      onBack={handleBack}
      nextButtonText={
        currentStep === totalSteps
          ? isSubmitting
            ? "Submitting…"
            : "Get recommendation"
          : "Next step"
      }
      isNextDisabled={!isStepValid() || isSubmitting}
      footerContent={
        <span className="text-muted-foreground text-sm">
          Step {currentStep} of {totalSteps}
        </span>
      }
    >
      {/* ════════════ STEP 1 — About you ════════════ */}
      {currentStep === 1 && (
        <div className="space-y-5">
          <div>
            <FieldLabel tooltip="Must be between 18 and 65">Age</FieldLabel>
            <Input
              type="number"
              placeholder="e.g. 28"
              min={18}
              max={65}
              value={formData.age}
              onChange={(e) => update("age", e.target.value)}
            />
          </div>

          <div>
            <FieldLabel tooltip="Your employment situation helps determine suitable products">
              Employment status
            </FieldLabel>
            <Select
              value={formData.employment_status}
              onValueChange={(v) => update("employment_status", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your status" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Employed",
                  "Self-employed",
                  "Freelancer",
                  "Student",
                  "Unemployed",
                ].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <FieldLabel tooltip="People who rely on your income (children, elderly parents, etc.)">
              Number of dependents
            </FieldLabel>
            <Input
              type="number"
              placeholder="e.g. 0"
              min={0}
              max={10}
              value={formData.num_dependents}
              onChange={(e) => update("num_dependents", e.target.value)}
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">
              Where are you located?
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "Metro Manila", title: "Metro Manila", sub: "NCR" },
                { value: "Urban", title: "Urban", sub: "Provincial city" },
                { value: "Rural", title: "Rural", sub: "Countryside" },
              ].map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => update("location_type", opt.value)}
                  className={`rounded-xl p-3 cursor-pointer transition-colors text-center ${
                    formData.location_type === opt.value
                      ? "border-2 border-primary bg-primary/5"
                      : "border border-border hover:bg-accent"
                  }`}
                >
                  <div className="text-sm font-semibold">{opt.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {opt.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Label className="text-sm font-medium">
                Digital savviness
              </Label>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {savvinessLabels[formData.digital_savviness]}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={formData.digital_savviness}
              onChange={(e) =>
                update("digital_savviness", Number(e.target.value))
              }
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Beginner</span>
              <span>Expert</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <Label className="text-sm font-medium text-foreground">
                Bank account
              </Label>
              <ToggleSwitch
                value={formData.has_bank_account}
                onChange={(v) => update("has_bank_account", v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <Label className="text-sm font-medium text-foreground">
                E-wallet
              </Label>
              <ToggleSwitch
                value={formData.has_ewallet}
                onChange={(v) => update("has_ewallet", v)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ════════════ STEP 2 — Your finances ════════════ */}
      {currentStep === 2 && (
        <div className="space-y-5">
          <CurrencyInput
            label="Monthly income"
            tooltip="Your total take-home pay per month"
            placeholder="e.g. 35000"
            value={formData.monthly_income}
            onChange={(v) => update("monthly_income", v)}
          />

          <CurrencyInput
            label="Monthly expenses"
            tooltip="Total amount you spend each month including bills and daily expenses"
            placeholder="e.g. 22000"
            value={formData.monthly_expenses}
            onChange={(v) => update("monthly_expenses", v)}
          />

          <CurrencyInput
            label="Existing savings"
            tooltip="How much you currently have saved across all accounts"
            placeholder="e.g. 50000"
            value={formData.existing_savings}
            onChange={(v) => update("existing_savings", v)}
          />

          {showSurplus && (
            <>
              <div
                className={`flex justify-between items-center rounded-xl px-4 py-3 text-sm ${
                  surplus > 0
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-destructive/10 border border-destructive/20"
                }`}
              >
                <span className="text-muted-foreground">
                  Monthly surplus
                </span>
                <span
                  className={`font-semibold ${
                    surplus > 0 ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  ₱ {surplus.toLocaleString()}
                </span>
              </div>

              {surplus < 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">
                    Your expenses exceed your income. Consider reviewing
                    your budget before investing.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ════════════ STEP 3 — Your goals ════════════ */}
      {currentStep === 3 && (
        <div className="space-y-5">
          <div>
            <FieldLabel tooltip="Your goal helps us match the right product for your timeline">
              What are you saving for?
            </FieldLabel>
            <Select
              value={formData.savings_goal}
              onValueChange={(v) => update("savings_goal", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your goal" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: "Emergency Fund", label: "Emergency fund" },
                  { value: "Education", label: "Education" },
                  { value: "Retirement", label: "Retirement" },
                  { value: "Travel", label: "Travel" },
                  { value: "Home/Property", label: "Home / Property" },
                  { value: "General Savings", label: "General savings" },
                  {
                    value: "Business Capital",
                    label: "Business capital",
                  },
                ].map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <FieldLabel tooltip="How comfortable are you with the possibility of losing some of your investment?">
              Risk tolerance
            </FieldLabel>
            <div className="space-y-2">
              {(
                [
                  {
                    value: "Conservative",
                    title: "Conservative",
                    subtitle: "Safe, stable, lower returns",
                    dot: "bg-emerald-500",
                  },
                  {
                    value: "Moderate",
                    title: "Moderate",
                    subtitle: "Balanced risk and reward",
                    dot: "bg-amber-500",
                  },
                  {
                    value: "Aggressive",
                    title: "Aggressive",
                    subtitle: "High growth, higher risk",
                    dot: "bg-destructive",
                  },
                ] as const
              ).map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => update("risk_tolerance", opt.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                    formData.risk_tolerance === opt.value
                      ? "border-2 border-primary bg-primary/5"
                      : "border border-border hover:bg-accent"
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dot}`}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{opt.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {opt.subtitle}
                    </div>
                  </div>
                  {formData.risk_tolerance === opt.value && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel tooltip="How long are you planning to keep your money invested?">
              Investment horizon
            </FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  value: "Short-term",
                  title: "Short-term",
                  subtitle: "< 1 year",
                },
                {
                  value: "Medium-term",
                  title: "Medium-term",
                  subtitle: "1 – 3 years",
                },
                {
                  value: "Long-term",
                  title: "Long-term",
                  subtitle: "3+ years",
                },
              ].map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => update("investment_horizon", opt.value)}
                  className={`text-center p-3 rounded-xl cursor-pointer transition-colors ${
                    formData.investment_horizon === opt.value
                      ? "border-2 border-primary bg-primary/5"
                      : "border border-border hover:bg-accent"
                  }`}
                >
                  <div className="text-sm font-semibold">{opt.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {opt.subtitle}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </MultiStepForm>
  )
}
