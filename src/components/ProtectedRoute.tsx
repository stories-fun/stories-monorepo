// components/ProtectedRoute.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { toast } from 'sonner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isConnected, address } = useAppKitAccount()
  const [isLoading, setIsLoading] = useState(true)

  // Only allow home page without wallet connection
  const PUBLIC_ROUTES = ['/']

  // Check if current route requires wallet connection
  const requiresWallet = (path: string): boolean => {
    // Allow only the home page without wallet
    return !PUBLIC_ROUTES.includes(path)
  }

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true)
      
      // Give wallet connection time to initialize
      await new Promise(resolve => setTimeout(resolve, 300))

      const currentPath = pathname

      console.log('🔍 Checking route access:', {
        currentPath,
        isConnected,
        address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'none',
        requiresWallet: requiresWallet(currentPath)
      })

      // If route doesn't require wallet, allow access
      if (!requiresWallet(currentPath)) {
        console.log('✅ Public route access granted:', currentPath)
        setIsLoading(false)
        return
      }

      // If route requires wallet but wallet is not connected, redirect to home
      if (requiresWallet(currentPath) && (!isConnected || !address)) {
        console.log('❌ Access denied - wallet not connected')
        
        toast.error('Wallet Connection Required', {
          description: 'Please connect your wallet to access this page',
          duration: 4000,
          position: 'top-center'
        })
        
        router.push('/')
        setIsLoading(false)
        return
      }

      // Wallet is connected and route requires wallet - allow access
      console.log('✅ Wallet connected - access granted')
      setIsLoading(false)
    }

    checkAccess()
  }, [pathname, isConnected, address, router])

  // Show loading screen while checking access
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#141414]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFDE7A] mx-auto mb-4"></div>
          <p className="text-[#AAAAAA] text-sm">Checking wallet connection...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}