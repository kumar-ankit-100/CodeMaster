// src/pages/_app.tsx
import { SessionProvider } from "next-auth/react"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import type { AppProps } from "next/app"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
      />
      <Component {...pageProps} />
    </SessionProvider>
  )
}