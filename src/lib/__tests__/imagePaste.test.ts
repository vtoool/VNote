import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { installImagePasteHandler } from '../imagePaste'

const originalClipboard = navigator.clipboard

function createFileList(files: File[]): FileList {
  const list: any = {
    length: files.length,
    item: (index: number) => files[index] ?? null
  }
  files.forEach((file, index) => {
    list[index] = file
  })
  return list as FileList
}

function createItemList(items: DataTransferItem[]): DataTransferItemList {
  const list: any = {
    length: items.length,
    item: (index: number) => items[index] ?? null,
    add: vi.fn(),
    clear: vi.fn(),
    remove: vi.fn()
  }
  items.forEach((item, index) => {
    list[index] = item
  })
  return list as DataTransferItemList
}

function createClipboardEvent(dataTransfer: DataTransfer): ClipboardEvent {
  const event = new Event('paste') as ClipboardEvent
  Object.defineProperty(event, 'clipboardData', {
    value: dataTransfer,
    configurable: true
  })
  Object.defineProperty(event, 'target', {
    value: document.createElement('div'),
    configurable: true
  })
  return event
}

function createFileItem(file: File): DataTransferItem {
  return {
    kind: 'file',
    type: file.type,
    getAsFile: () => file,
    getAsString: vi.fn(),
    webkitGetAsEntry: vi.fn()
  } as unknown as DataTransferItem
}

function createDataTransfer(options: { files?: File[]; items?: DataTransferItem[] } = {}): DataTransfer {
  const { files = [], items = [] } = options
  return {
    dropEffect: 'none',
    effectAllowed: 'all',
    files: createFileList(files),
    items: createItemList(items),
    types: [],
    getData: () => '',
    setData: () => {},
    clearData: () => {},
    setDragImage: () => {}
  } as unknown as DataTransfer
}

describe('installImagePasteHandler', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { read: vi.fn().mockResolvedValue([]) },
      configurable: true
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true
      })
    } else {
      Reflect.deleteProperty(navigator as unknown as Record<string, unknown>, 'clipboard')
    }
  })

  it('invokes onImages when clipboard files include an image', async () => {
    const file = new File(['data'], 'image.png', { type: 'image/png' })
    const onImages = vi.fn()
    const cleanup = installImagePasteHandler({ onImages })

    const dataTransfer = createDataTransfer({ files: [file] })
    const event = createClipboardEvent(dataTransfer)
    const preventDefault = vi.fn()
    event.preventDefault = preventDefault

    window.dispatchEvent(event)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(preventDefault).toHaveBeenCalled()
    expect(onImages).toHaveBeenCalledTimes(1)
    const [blobs, context] = onImages.mock.calls[0]
    expect(blobs).toEqual([file])
    expect(context.event).toBe(event)

    cleanup()
  })

  it('invokes onImages when clipboard items include multiple images', async () => {
    const png = new File(['a'], 'a.png', { type: 'image/png' })
    const jpeg = new File(['b'], 'b.jpg', { type: 'image/jpeg' })
    const onImages = vi.fn()
    const cleanup = installImagePasteHandler({ onImages })

    const items = [createFileItem(png), createFileItem(jpeg)]

    const dataTransfer = createDataTransfer({ files: [], items })
    const event = createClipboardEvent(dataTransfer)
    const preventDefault = vi.fn()
    event.preventDefault = preventDefault

    window.dispatchEvent(event)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(onImages).toHaveBeenCalledTimes(1)
    const [blobs] = onImages.mock.calls[0]
    expect(blobs).toEqual([png, jpeg])
    expect(preventDefault).toHaveBeenCalled()

    cleanup()
  })

  it('falls back to onNoImage when clipboard has no images', async () => {
    const onImages = vi.fn()
    const onNoImage = vi.fn()
    const cleanup = installImagePasteHandler({ onImages, onNoImage })

    const dataTransfer = createDataTransfer({ files: [], items: [] })
    const event = createClipboardEvent(dataTransfer)
    const preventDefault = vi.fn()
    event.preventDefault = preventDefault

    window.dispatchEvent(event)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(onImages).not.toHaveBeenCalled()
    expect(onNoImage).toHaveBeenCalledTimes(1)
    expect(preventDefault).not.toHaveBeenCalled()

    cleanup()
  })
})
