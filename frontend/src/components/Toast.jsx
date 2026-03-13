import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div aria-live="polite" className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

const ICONS = {
  success: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
  error:   <XCircle     className="w-4 h-4 text-red-400 shrink-0" />,
  info:    <Info        className="w-4 h-4 text-blue-400 shrink-0" />,
}

function ToastItem({ toast, onRemove }) {
  return (
    <div className="toast-item pointer-events-auto flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 shadow-2xl min-w-64 max-w-sm">
      {ICONS[toast.type]}
      <span className="text-sm text-white flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-zinc-500 hover:text-white transition-colors ml-1 shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
