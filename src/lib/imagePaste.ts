export interface ImagePasteContext {
  at?: { x: number; y: number }
  targetCardId?: string
  event: ClipboardEvent
}

export interface ImagePasteHandlerOptions {
  getCanvasPos?: () => { x: number; y: number } | null
  resolveTargetCardId?: (event: ClipboardEvent) => string | null
  shouldHandleEvent?: (event: ClipboardEvent) => boolean
  onImages: (blobs: Blob[], context: ImagePasteContext) => void | Promise<void>
  onNoImage?: (event: ClipboardEvent) => void
  onError?: (error: unknown, event: ClipboardEvent) => void
}

const IMAGE_MIME_PREFIX = 'image/'

function extractImagesFromDataTransfer(dataTransfer: DataTransfer): Blob[] {
  const blobs: Blob[] = []

  if (dataTransfer.files?.length) {
    for (const file of Array.from(dataTransfer.files)) {
      if (file.type.startsWith(IMAGE_MIME_PREFIX)) {
        blobs.push(file)
      }
    }
  }

  if (blobs.length > 0) {
    return blobs
  }

  if (dataTransfer.items?.length) {
    for (const item of Array.from(dataTransfer.items)) {
      if (item.kind === 'file' && item.type.startsWith(IMAGE_MIME_PREFIX)) {
        const file = item.getAsFile()
        if (file) {
          blobs.push(file)
        }
      }
    }
  }

  return blobs
}

async function readImagesFromClipboard(): Promise<Blob[]> {
  if (!navigator.clipboard || typeof (navigator.clipboard as Clipboard & { read?: () => Promise<ClipboardItem[]> }).read !== 'function') {
    return []
  }

  try {
    const items = await (navigator.clipboard as Clipboard & { read: () => Promise<ClipboardItem[]> }).read()
    const blobs: Blob[] = []
    for (const item of items) {
      const type = item.types.find((entry) => entry.startsWith(IMAGE_MIME_PREFIX))
      if (type) {
        blobs.push(await item.getType(type))
      }
    }
    return blobs
  } catch (error) {
    throw error
  }
}

export function installImagePasteHandler(options: ImagePasteHandlerOptions) {
  const handlePaste = async (event: ClipboardEvent) => {
    if (options.shouldHandleEvent && !options.shouldHandleEvent(event)) {
      return
    }

    if (!event.clipboardData) {
      options.onNoImage?.(event)
      return
    }

    const blobs = extractImagesFromDataTransfer(event.clipboardData)
    const context: ImagePasteContext = {
      at: options.getCanvasPos?.() ?? undefined,
      targetCardId: options.resolveTargetCardId?.(event) ?? undefined,
      event
    }

    if (blobs.length > 0) {
      event.preventDefault()
      try {
        await options.onImages(blobs, context)
      } catch (error) {
        options.onError?.(error, event)
      }
      return
    }

    try {
      const clipboardBlobs = await readImagesFromClipboard()
      if (clipboardBlobs.length > 0) {
        event.preventDefault()
        await options.onImages(clipboardBlobs, context)
        return
      }
    } catch (error) {
      options.onError?.(error, event)
      return
    }

    options.onNoImage?.(event)
  }

  window.addEventListener('paste', handlePaste, true)
  return () => window.removeEventListener('paste', handlePaste, true)
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

export async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(blob)
      const dimensions = { width: bitmap.width, height: bitmap.height }
      if (typeof bitmap.close === 'function') {
        bitmap.close()
      }
      return dimensions
    } catch {
      // fall through to DOM image approach
    }
  }

  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(blob)
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
      URL.revokeObjectURL(url)
    }
    image.onerror = (error) => {
      URL.revokeObjectURL(url)
      reject(error)
    }
    image.src = url
  })
}

export function clampImageDimensions(
  width: number,
  height: number,
  maxWidth = 720,
  maxHeight = 540
): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return {
      width: Math.max(1, Number.isFinite(width) ? Math.round(width) : maxWidth),
      height: Math.max(1, Number.isFinite(height) ? Math.round(height) : maxHeight)
    }
  }

  const widthScale = maxWidth > 0 ? maxWidth / width : 1
  const heightScale = maxHeight > 0 ? maxHeight / height : 1
  const scale = Math.min(1, widthScale, heightScale)

  if (scale >= 1) {
    return { width, height }
  }

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  }
}
