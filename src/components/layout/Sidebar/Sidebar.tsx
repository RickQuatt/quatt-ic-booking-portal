import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ExternalLink, PanelLeft, PanelLeftClose, Info } from "lucide-react";
import Confetti from "react-confetti";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Badge } from "@/components/ui/Badge";
import { Brand } from "@/components/shared/Brand";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Cpu,
  Users,
  Home,
  DollarSign,
  Smartphone,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/firebase";
import { useTour } from "@/hooks/useTour";
import { SIDEBAR_TOUR_ID, sidebarTourSteps } from "./sidebarTourSteps";

const legacyDashboardUrl = "https://refactor.quatt-support-dashboard.pages.dev";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  tourId: string;
}

const navigationItems: NavItem[] = [
  {
    label: "CIC Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    tourId: "nav-cic-dashboard",
  },
  { label: "CIC List", href: "/cics", icon: Cpu, tourId: "nav-cic-list" },
  {
    label: "Installers",
    href: "/installers",
    icon: Users,
    tourId: "nav-installers",
  },
  {
    label: "Installations",
    href: "/installations",
    icon: Home,
    tourId: "nav-installations",
  },
  {
    label: "Dynamic Pricing",
    href: "/dynamic-pricing",
    icon: DollarSign,
    tourId: "nav-dynamic-pricing",
  },
  {
    label: "Devices",
    href: "/devices",
    icon: Smartphone,
    tourId: "nav-devices",
  },
  {
    label: "Legacy Dashboard",
    href: "https://refactor.quatt-support-dashboard.pages.dev/",
    icon: Home,
    tourId: "nav-legacy",
  },
];

const sidebarVariants = {
  expanded: {
    width: 256,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
  },
  collapsed: {
    width: 64,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const navTextVariants = {
  expanded: {
    opacity: 1,
    width: "auto",
    transition: { duration: 0.2, delay: 0.1 },
  },
  collapsed: {
    opacity: 0,
    width: 0,
    transition: { duration: 0.15 },
  },
};

const backdropVariants = {
  open: { opacity: 1, transition: { duration: 0.2 } },
  closed: { opacity: 0, transition: { duration: 0.2 } },
};

const mobileDrawerVariants = {
  open: {
    x: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 200 },
  },
  closed: {
    x: "-100%",
    transition: { type: "spring" as const, damping: 25, stiffness: 200 },
  },
};

const staggerContainerVariants = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

const staggerItemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

export interface SidebarProps {
  className?: string;
}

/**
 * Modern animated sidebar with collapsible states
 *
 * Features:
 * - Smooth width transitions (expanded: 256px, collapsed: 64px)
 * - Active route highlighting with left border accent
 * - Integrated theme toggle
 * - Environment badge display
 * - Responsive mobile drawer on <768px
 * - Persists state in localStorage
 * - Keyboard accessible navigation
 *
 * @example
 * ```tsx
 * <Sidebar />
 * ```
 */
export const Sidebar = ({ className }: SidebarProps) => {
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(() => {
    // Restore from localStorage or default to true
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebar-expanded");
      return stored ? JSON.parse(stored) : true;
    }
    return true;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const currentPath = location;

  navigationItems[navigationItems.length - 1].href =
    `${legacyDashboardUrl}${currentPath}`;

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Persist sidebar state
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-expanded", JSON.stringify(isExpanded));
    }
  }, [isExpanded]);

  // Close mobile drawer on route change
  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [location, isMobile]);

  const handleToggle = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") {
      return location === "/dashboard" || location === "/";
    }
    return location.startsWith(href);
  };

  // Mobile: Render as overlay drawer
  if (isMobile) {
    return (
      <>
        {/* Fixed mobile header bar */}
        <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-white dark:bg-dark-foreground border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="h-full flex items-center px-4 gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleToggle}
              aria-label="Open navigation"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
            <Brand className="h-6 w-auto" />
          </div>
        </header>

        {/* Backdrop */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
          )}
        </AnimatePresence>

        {/* Mobile drawer */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.aside
              variants={mobileDrawerVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className={cn(
                "fixed left-0 top-0 bottom-0 z-50 w-64",
                "bg-white dark:bg-dark-foreground border-r border-gray-200 dark:border-gray-800 shadow-xl",
                "flex flex-col",
                className,
              )}
            >
              <SidebarContent
                isExpanded={true}
                isActiveRoute={isActiveRoute}
                onToggle={handleToggle}
                isMobile={true}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop: Render as fixed sidebar
  return (
    <motion.aside
      variants={sidebarVariants}
      initial={false}
      animate={isExpanded ? "expanded" : "collapsed"}
      className={cn(
        "relative h-screen border-r border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-dark-foreground",
        "flex flex-col overflow-hidden z-50",
        className,
      )}
    >
      <SidebarContent
        isExpanded={isExpanded}
        isActiveRoute={isActiveRoute}
        onToggle={handleToggle}
        isMobile={false}
      />
    </motion.aside>
  );
};

interface SidebarContentProps {
  isExpanded: boolean;
  isActiveRoute: (href: string) => boolean;
  onToggle: () => void;
  isMobile: boolean;
}

const SidebarContent = ({
  isExpanded,
  isActiveRoute,
  onToggle,
  isMobile,
}: SidebarContentProps) => {
  const environment = import.meta.env.ENV;
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Track window size for confetti
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Tour functionality
  const { startTour, hasCompleted } = useTour({
    tourId: SIDEBAR_TOUR_ID,
    steps: sidebarTourSteps,
  });

  // Auto-start tour on first visit (desktop only) with confetti
  useEffect(() => {
    if (!isMobile && !hasCompleted) {
      const timer = setTimeout(() => {
        setShowConfetti(true);
        startTour();
        // Stop confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 10000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isMobile, hasCompleted, startTour]);

  return (
    <>
      {/* Confetti for first-time tour */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={5000}
          style={{ position: "fixed", top: 0, left: 0, zIndex: 10001 }}
        />
      )}
      {/* Logo/Header space */}
      <div className="h-16 flex items-center border-b border-gray-200 dark:border-gray-800 px-3 relative">
        {/* Desktop collapsed state: Center toggle button */}
        {!isMobile && !isExpanded ? (
          <>
            {/* <Brand
              className="absolute left-1 pointer-events-none"
              type="logo"
            /> */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="mx-auto"
              aria-label="Expand sidebar"
              data-tour="sidebar-toggle"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <>
            {/* Logo */}
            <motion.div
              variants={navTextVariants}
              animate={isExpanded ? "expanded" : "collapsed"}
              className="flex-1 overflow-hidden"
            >
              <Brand className="h-8 w-auto" />
            </motion.div>

            {/* Toggle button (desktop expanded or mobile) */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onToggle}
                    className="shrink-0"
                    aria-label={
                      isMobile ? "Close navigation" : "Collapse sidebar"
                    }
                    data-tour="sidebar-toggle"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Navigation items */}
      <motion.nav
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
        className="flex-1 overflow-y-auto py-4"
      >
        <ul className="space-y-1 px-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            const isExternal = item.href.startsWith("http");
            return (
              <motion.li key={item.href} variants={staggerItemVariants}>
                <Button
                  className={cn(
                    "w-full p-0",
                    isExpanded ? "justify-start" : "justify-center",
                  )}
                  variant="ghost"
                >
                  {isExternal ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "w-full flex items-center rounded-lg relative",
                        "transition-all duration-200",
                        "hover:bg-gray-100 dark:hover:bg-gray-800",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                        isActive && [
                          "bg-primary/10 dark:bg-primary/20 text-primary font-medium",
                          "before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-primary before:rounded-r",
                        ],
                        isExpanded ? "gap-3 px-3 py-2" : "justify-center p-2",
                      )}
                      aria-current={isActive ? "page" : undefined}
                      title={!isExpanded ? item.label : undefined}
                      data-tour={item.tourId}
                    >
                      <ExternalLink className="h-4 w-4 shrink-0" />
                      <motion.span
                        variants={navTextVariants}
                        animate={isExpanded ? "expanded" : "collapsed"}
                        className="overflow-hidden whitespace-nowrap text-sm font-medium"
                      >
                        {item.label}
                      </motion.span>
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "w-full flex items-center rounded-lg relative",
                        "transition-all duration-200",
                        "hover:bg-gray-100 dark:hover:bg-gray-800",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                        isActive && [
                          "bg-primary/10 dark:bg-primary/20 text-primary font-medium",
                          "before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-primary before:rounded-r",
                        ],
                        isExpanded ? "gap-3 px-3 py-2" : "justify-center p-2",
                      )}
                      aria-current={isActive ? "page" : undefined}
                      title={!isExpanded ? item.label : undefined}
                      data-tour={item.tourId}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <motion.span
                        variants={navTextVariants}
                        animate={isExpanded ? "expanded" : "collapsed"}
                        className="overflow-hidden whitespace-nowrap text-sm font-medium"
                      >
                        {item.label}
                      </motion.span>
                    </Link>
                  )}
                </Button>
              </motion.li>
            );
          })}
        </ul>
      </motion.nav>

      {/* Footer: Theme toggle, Tour, Logout + Environment */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-3">
        {isExpanded ? (
          /* Expanded: horizontal layout */
          <div className="flex items-center justify-between">
            <div data-tour="theme-toggle">
              <ThemeToggle expanded={true} />
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={startTour}
                title="Take a tour"
                aria-label="Take a tour"
                data-tour="tour-info"
              >
                <Info className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Logout"
                aria-label="Logout"
                data-tour="logout-btn"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* Collapsed: vertical centered stack */
          <div className="flex flex-col items-center gap-2">
            <div data-tour="theme-toggle">
              <ThemeToggle expanded={false} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={startTour}
              title="Take a tour"
              aria-label="Take a tour"
              data-tour="tour-info"
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Logout"
              aria-label="Logout"
              data-tour="logout-btn"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Environment badge - only when expanded */}
        {isExpanded && environment && (
          <motion.div
            variants={navTextVariants}
            animate="expanded"
            className="flex justify-center"
          >
            <Badge variant="outline" className="text-xs">
              {environment}
            </Badge>
          </motion.div>
        )}
      </div>
    </>
  );
};
