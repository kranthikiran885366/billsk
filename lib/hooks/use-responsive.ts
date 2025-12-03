"use client"

import { useState, useEffect } from "react"

export type DeviceType = "mobile" | "tablet" | "desktop"
export type Platform = "windows" | "mac" | "linux" | "ios" | "android" | "unknown"

export function useResponsive() {
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop")
  const [platform, setPlatform] = useState<Platform>("unknown")
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      const userAgent = navigator.userAgent.toLowerCase()
      
      // Device type detection
      if (width < 768) {
        setDeviceType("mobile")
        setIsMobile(true)
        setIsTablet(false)
        setIsDesktop(false)
      } else if (width < 1024) {
        setDeviceType("tablet")
        setIsMobile(false)
        setIsTablet(true)
        setIsDesktop(false)
      } else {
        setDeviceType("desktop")
        setIsMobile(false)
        setIsTablet(false)
        setIsDesktop(true)
      }

      // Platform detection
      if (userAgent.includes("windows")) setPlatform("windows")
      else if (userAgent.includes("mac")) setPlatform("mac")
      else if (userAgent.includes("linux")) setPlatform("linux")
      else if (userAgent.includes("iphone") || userAgent.includes("ipad")) setPlatform("ios")
      else if (userAgent.includes("android")) setPlatform("android")
      else setPlatform("unknown")
    }

    checkDevice()
    window.addEventListener("resize", checkDevice)
    return () => window.removeEventListener("resize", checkDevice)
  }, [])

  return {
    deviceType,
    platform,
    isMobile,
    isTablet,
    isDesktop,
    breakpoints: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      "2xl": 1536
    }
  }
}