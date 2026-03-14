import '@/app/edit/editor.css'
import { Toaster } from '@/app/reactvideoeditor/pro/components/ui/toaster'

export default function EditLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}

