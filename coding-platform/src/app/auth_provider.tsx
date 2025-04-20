"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import AuthDialog from '../components/auth_dialog'
import { useSession } from 'next-auth/react'

interface AuthContextType {
  openAuthDialog: () => void
  closeAuthDialog: () => void
  isAuthDialogOpen: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  openAuthDialog: () => {},
  closeAuthDialog: () => {},
  isAuthDialogOpen: false,
  isAuthenticated: false
})

export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const { data: session, status } = useSession()

  const openAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(true)
  }, [])

  const closeAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(false)
  }, [])

  const handleLoginSuccess = useCallback(() => {
    // You can do any post-login operations here
    console.log('Login successful')
  }, [])

  return (
    <AuthContext.Provider
      value={{
        openAuthDialog,
        closeAuthDialog,
        isAuthDialogOpen,
        isAuthenticated: status === 'authenticated'
      }}
    >
      {children}
      <AuthDialog 
        isOpen={isAuthDialogOpen} 
        onClose={closeAuthDialog} 
        onLogin={handleLoginSuccess} 
      />
    </AuthContext.Provider>
  )
}