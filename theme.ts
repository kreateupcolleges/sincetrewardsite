
/**
 * CENTRALIZED THEME CONFIGURATION
 * Now supports Dark Mode via Tailwind classes
 */

export const THEME = {
  // Layout Colors
  background: "bg-gray-50 dark:bg-gray-900",
  textMain: "text-gray-900 dark:text-gray-100",
  textMuted: "text-gray-500 dark:text-gray-400",
  
  // Primary Brand Colors (Indigo)
  primary: "indigo",
  primaryBg: "bg-indigo-600 dark:bg-indigo-500",
  primaryHover: "hover:bg-indigo-700 dark:hover:bg-indigo-600",
  primaryText: "text-indigo-700 dark:text-indigo-400",
  primaryLight: "bg-indigo-50 dark:bg-indigo-900/30",
  
  // Components
  card: {
    base: "bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700",
    header: "border-b border-gray-100 dark:border-gray-700 bg-indigo-50 dark:bg-gray-800/50 px-6 py-4",
    body: "p-6"
  },
  
  // Input Fields - Forced text colors to avoid visibility issues
  input: {
    base: "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 h-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 focus:outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400",
    label: "block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
  },
  
  // Buttons
  button: {
    primary: "bg-indigo-600 dark:bg-indigo-500 text-white px-10 py-3 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed shadow transition-colors flex items-center justify-center space-x-2",
    secondary: "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors",
    pagination: "px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
  },

  // Tables
  table: {
    header: "bg-indigo-700 dark:bg-indigo-900 text-white",
    rowEven: "bg-white dark:bg-gray-800",
    rowHover: "hover:bg-indigo-50 dark:hover:bg-gray-700/50 transition-colors",
    cell: "px-4 py-3 border-b border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-300"
  },

  // Status Colors
  status: {
    success: "text-green-600 dark:text-green-400",
    error: "text-red-600 dark:text-red-400",
    warning: "text-orange-600 dark:text-orange-400",
    bgSuccess: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
    bgError: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
    bgWarning: "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300",
    bgInfo: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
  }
};
