"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const multiStepFormVariants = cva("w-full", {
  variants: {
    size: {
      default: "max-w-lg",
      sm: "max-w-sm",
      lg: "max-w-2xl",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

const stepVariants = {
  hidden: { x: 100, opacity: 0 },
  enter: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
}

interface MultiStepFormProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof multiStepFormVariants> {
  title: string
  description?: string
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
  nextButtonText?: string
  isNextDisabled?: boolean
  footerContent?: React.ReactNode
  onClose?: () => void
}

const MultiStepForm = React.forwardRef<HTMLDivElement, MultiStepFormProps>(
  (
    {
      className,
      size,
      title,
      description,
      currentStep,
      totalSteps,
      onNext,
      onBack,
      nextButtonText = "Next",
      isNextDisabled = false,
      footerContent,
      onClose,
      children,
      ...props
    },
    ref,
  ) => {
    const progress = (currentStep / totalSteps) * 100

    return (
      <div
        ref={ref}
        className={cn(multiStepFormVariants({ size }), className)}
        {...props}
      >
        <Card>
          <CardHeader className="relative">
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Progress value={progress} className="mb-4" />
            <CardTitle>{title}</CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="hidden"
                animate="enter"
                exit="exit"
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex justify-between">
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <Button variant="outline" onClick={onBack}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              {footerContent}
            </div>
            <Button onClick={onNext} disabled={isNextDisabled}>
              {nextButtonText}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  },
)
MultiStepForm.displayName = "MultiStepForm"

export { MultiStepForm, multiStepFormVariants }
