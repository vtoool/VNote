import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { installImagePasteHandler } from '../imagePaste'

const originalClipboard = navigator.clipboard

function createClipboardEvent(dataTransfer: Partial<DataTransfer>): ClipboardEvent {
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

describe('installImagePasteHandler', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { read: vi.fn().mockResolvedValue([]) },
      configurable: true
    })
  })

    afterEach(() => {
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', {
          value: originalClipboard,
          configurable: true
        })
      } else {
        delete (navigator as Navigator & { clipboard?: Clipboard }).clipboard
      }
    })

  it('invokes onImages when clipboard files include an image', async () => {
    const file = new File(['data'], 'image.png', { type: 'image/png' })
    const onImages = vi.fn()
    const cleanup = installImagePasteHandler({ onImages })

    const event = createClipboardEvent({ files: [file], items: [] } as DataTransfer)
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

    const items = [
      { kind: 'file', type: 'image/png', getAsFile: () => png },
      { kind: 'file', type: 'image/jpeg', getAsFile: () => jpeg }
    ] as unknown as DataTransferItemList

    const event = createClipboardEvent({ files: [] as unknown as FileList, items } as DataTransfer)
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

    const event = createClipboardEvent({ files: [] as unknown as FileList, items: [] as unknown as DataTransferItemList } as DataTransfer)
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
