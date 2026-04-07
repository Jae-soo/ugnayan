'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import UserRegistration from '@/components/UserRegistration'

export default function ResidentRegisterPage(): React.JSX.Element {
  const router = useRouter()

  const handleSuccess = (): void => {
    router.push('/login')
  }

  const handleClose = (): void => {
    router.push('/login')
  }

  return (
    <UserRegistration
      open={true}
      onOpenChange={handleClose}
      onSuccess={handleSuccess}
      asPage
    />
  )
}
