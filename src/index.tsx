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
