"use client"

import { useState } from "react"
import { X } from "lucide-react"
import Image from "next/image"

interface ImageModalProps {
  src: string
  alt: string
  trigger: React.ReactNode
}

export default function ImageModal({ src, alt, trigger }: ImageModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger}
      </div>
      
      {open && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
            <Image 
              src={src} 
              alt={alt} 
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 80vw"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  )
}