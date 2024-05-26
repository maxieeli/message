'use client'

import React from 'react'
import ReactDOM from 'react-dom'
import DOMPurify from 'dompurify'
import { getAsset, Loader } from './assets'
import { useIsDocumentHidden } from './hooks'
import { toast, ToastState } from './state'
import './styles.css'
import {
  isAction,
  type ExternalToast,
  type HeightT,
  type ToasterProps,
  type ToastProps,
  type ToastT,
  type ToastToDismiss,
} from './types'

// Visible toasts amount
const VISIBLE_TOASTS_AMOUNT = 3
// Viewport padding
const VIEWPORT_OFFSET = '32px'
// Default lifetime of a toasts (in ms)
const TOAST_LIFETIME = 4000
// Default toast width
const TOAST_WIDTH = 356
// Default gap between toasts
const GAP = 14
// Threshold to dismiss a toast
const SWIPE_THRESHOLD = 20
// Equal to exit animation duration
const TIME_BEFORE_UNMOUNT = 200

function _cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function getDocumentDirection(): ToasterProps['dir'] {
  if (typeof window === 'undefined') return 'ltr'
  if (typeof document === 'undefined') return 'ltr' // For Fresh purpose
  const dirAttribute = document.documentElement.getAttribute('dir')
  if (dirAttribute === 'auto' || !dirAttribute) {
    return window.getComputedStyle(document.documentElement).direction as ToasterProps['dir']
  }
  return dirAttribute as ToasterProps['dir']
}

const Toast = (props: ToastProps) => {
  const {
    invert: ToasterInvert,
    toast,
    unstyled,
    interacting,
    setHeights,
    visibleToasts,
    heights,
    index,
    toasts,
    expanded,
    removeToast,
    defaultRichColors,
    closeButton: closeButtonFromToaster,
    style,
    cancelButtonStyle,
    actionButtonStyle,
    className = '',
    descriptionClassName = '',
    duration: durationFromToaster,
    position,
    gap,
    loadingIcon: loadingIconProp,
    expandByDefault,
    classNames,
    icons,
    closeButtonAriaLabel = 'Close toast',
    pauseWhenPageIsHidden,
    cn,
  } = props

  const [mounted, setMounted] = React.useState(false)
  const [removed, setRemoved] = React.useState(false)
  const [swiping, setSwiping] = React.useState(false)
  const [swipeOut, setSwipeOut] = React.useState(false)
  const [offsetBeforeRemove, setOffsetBeforeRemove] = React.useState(0)
  const [initialHeight, setInitialHeight] = React.useState(0)
  const dragStartTime = React.useRef<Date | null>(null)
  const toastRef = React.useRef<HTMLLIElement>(null)
  const isFront = index === 0
  const isVisible = index + 1 <= visibleToasts
  const toastType = toast.type
  const dismissible = toast.dismissible !== false
  const toastClassname = toast.className || ''
  const toastDescriptionClassname = toast.descriptionClassName || ''

  // Height index is used to calculate the offset as it gets updated before the toast array, which means we can calculate the new layout faster.
  const heightIndex = React.useMemo(
    () => heights.findIndex((height) => height.toastId === toast.id) || 0,
    [heights, toast.id],
  )
  const closeButton = React.useMemo(
    () => toast.closeButton ?? closeButtonFromToaster,
    [toast.closeButton, closeButtonFromToaster],
  )
  const duration = React.useMemo(
    () => toast.duration || durationFromToaster || TOAST_LIFETIME,
    [toast.duration, durationFromToaster],
  )
  const closeTimerStartTimeRef = React.useRef(0)
  const offset = React.useRef(0)
  const lastCloseTimerStartTimeRef = React.useRef(0)
  const pointerStartRef = React.useRef<{ x: number y: number } | null>(null)
  const [y, x] = position.split('-')
  const toastsHeightBefore = React.useMemo(() => {
    return heights.reduce((prev, curr, reducerIndex) => {
      // Calculate offset up until current toast
      if (reducerIndex >= heightIndex) {
        return prev
      }
      return prev + curr.height
    }, 0)
  }, [heights, heightIndex])
  const isDocumentHidden = useIsDocumentHidden()
  const invert = toast.invert || ToasterInvert
  const disabled = toastType === 'loading'

  offset.current = React.useMemo(() => heightIndex * gap + toastsHeightBefore, [heightIndex, toastsHeightBefore])
  React.useEffect(() => {
    // trigger enter animation without using css animation
    setMounted(true)
  }, [])

  React.useLayoutEffect(() => {
    if (!mounted) return
    const toastNode = toastRef.current
    const originalHeight = toastNode.style.height
    toastNode.style.height = 'auto'
    const newHeight = toastNode.getBoundingClientRect().height
    toastNode.style.height = originalHeight
    setInitialHeight(newHeight)

    setHeights((heights) => {
      const alreadyExists = heights.find((height) => height.toastId === toast.id)
      if (!alreadyExists) {
        return [{ toastId: toast.id, height: newHeight, position: toast.position }, ...heights]
      } else {
        return heights.map((height) => (height.toastId === toast.id ? { ...height, height: newHeight } : height))
      }
    })
  }, [mounted, toast.title, toast.description, setHeights, toast.id])

}
