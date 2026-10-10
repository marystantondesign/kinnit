import { useEffect } from "react"
import { RouterProvider } from "react-router"
import { router } from "./routes"

declare global {
  interface Window {
    Tally?: {
      openPopup: (formId: string, options?: Record<string, any>) => void
    }
  }
}

export default function App() {
  useEffect(() => {
    const existing = document.querySelector(
      'script[src="https://tally.so/widgets/embed.js"]'
    )

    if (!existing) {
      const script = document.createElement("script")
      script.src = "https://tally.so/widgets/embed.js"
      script.async = true
      document.head.appendChild(script)
    }
  }, [])

  return (
    <>
      <RouterProvider router={router} />

      <button
        type="button"
        className="hidden md:block"
        style={{
          position: "fixed",
          right: "20px",
          bottom: "20px",
          zIndex: 40,
          padding: "12px 16px",
          borderRadius: "999px",
          border: "1px solid #ddd",
          background: "white",
          color: "black",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        }}
        onClick={() => {
          window.Tally?.openPopup("81pQNo", {
            emoji: {
              text: "👋",
              animation: "wave",
            },
          })
        }}
      >
        Give Feedback?
      </button>
    </>
  )
}
