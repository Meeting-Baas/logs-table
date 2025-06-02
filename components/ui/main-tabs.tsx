import { cn } from "@/lib/utils"
import { motion } from "motion/react"

interface Tab {
  id: string
  label: string
  count?: number | null
}

interface MainTabsProps {
  currentTab: string
  setCurrentTab: (tabId: string) => void
  tabs: Tab[]
  disabled?: boolean
  layoutId?: string
  containerClassName?: string
}

export const MainTabs = ({
  currentTab,
  setCurrentTab,
  tabs,
  disabled,
  layoutId = "tabs-underline",
  containerClassName
}: MainTabsProps) => {
  return (
    <>
      {/* For smaller devices, tabs are rendered in a column */}
      <div
        className={cn(
          "flex flex-col items-start border-border border-l text-sm sm:hidden",
          containerClassName
        )}
      >
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={cn(
              "relative px-4 py-3 transition-colors focus:outline-none",
              currentTab === tab.id
                ? "font-semibold text-primary disabled:font-normal disabled:text-muted-foreground/40"
                : "text-muted-foreground hover:text-foreground disabled:text-muted-foreground/40"
            )}
            onClick={() => setCurrentTab(tab.id)}
            disabled={disabled}
          >
            {tab.label}
            {tab.count && tab.count > 0 && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
                  {tab.count}
                </span>
              )}
            {currentTab === tab.id && (
              <motion.div
                layoutId={`${layoutId}-mobile`}
                className={cn(
                  "absolute top-0 left-0 h-full w-1 rounded-r-md",
                  disabled ? "bg-muted-foreground/40" : "bg-primary"
                )}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 30,
                  duration: 0.3
                }}
              />
            )}
          </button>
        ))}
      </div>
      {/* For larger devices, tabs are rendered in a row */}
      <div className={cn("hidden border-border border-b text-sm sm:flex", containerClassName)}>
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={cn(
              "group relative px-5 py-3 transition-colors",
              currentTab === tab.id
                ? "font-semibold text-primary disabled:font-normal disabled:text-muted-foreground/40"
                : "text-muted-foreground hover:text-foreground disabled:text-muted-foreground/40 after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-transparent after:transition-colors hover:after:bg-muted-foreground focus:outline-none"
            )}
            onClick={() => setCurrentTab(tab.id)}
            disabled={disabled}
          >
            {tab.label}
            {tab.count && tab.count > 0 && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs ml-1">
                {tab.count}
              </span>
            )}
            {currentTab === tab.id ? (
              <motion.div
                layoutId={layoutId}
                className={cn(
                  "absolute right-0 bottom-0 left-0 h-0.5 rounded-t-md",
                  disabled ? "bg-muted-foreground/40" : "bg-primary"
                )}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 30,
                  duration: 0.3
                }}
              />
            ) : null}
          </button>
        ))}
      </div>
    </>
  )
}
