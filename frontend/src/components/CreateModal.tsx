import {
  ArrowLeft,
  Check,
  Clapperboard,
  ImagePlus,
  Images,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import {
  type DragEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPost, createReel, createStory } from '../api/create'
import { getApiError } from '../utils/apiError'
import { isVideoUrl } from '../utils/media'

type CreateType = 'post' | 'reel' | 'story'
type CreateStep = 'type' | 'upload' | 'details' | 'success'

interface CreateModalProps {
  isOpen: boolean
  onClose: () => void
}

const typeConfig: Record<
  CreateType,
  {
    label: string
    icon: typeof Images
    accept: string
    maxFiles: number
    allowedTypes: string[]
  }
> = {
  post: {
    label: 'Публикация',
    icon: Images,
    accept: 'image/jpeg,image/png,image/webp,video/mp4',
    maxFiles: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
  },
  reel: {
    label: 'Reels',
    icon: Clapperboard,
    accept: 'video/mp4',
    maxFiles: 1,
    allowedTypes: ['video/mp4'],
  },
  story: {
    label: 'История',
    icon: ImagePlus,
    accept: 'image/jpeg,image/png,image/webp,video/mp4',
    maxFiles: 1,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
  },
}

function formatFilesLabel(files: File[]) {
  if (files.length === 0) {
    return ''
  }

  if (files.length === 1) {
    return files[0].name
  }

  return `${files.length} файлов`
}

function MediaPreview({
  file,
  url,
  className = '',
}: {
  file: File
  url: string
  className?: string
}) {
  if (isVideoUrl(file.name) || file.type === 'video/mp4') {
    return (
      <video
        className={`h-full w-full object-cover ${className}`}
        src={url}
        muted
        playsInline
        controls
      />
    )
  }

  return (
    <img
      className={`h-full w-full object-cover ${className}`}
      src={url}
      alt={file.name}
    />
  )
}

export function CreateModal({ isOpen, onClose }: CreateModalProps) {
  const [step, setStep] = useState<CreateStep>('type')
  const [activeType, setActiveType] = useState<CreateType>('post')
  const [files, setFiles] = useState<File[]>([])
  const [description, setDescription] = useState('')
  const [hashtag, setHashtag] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [activePreviewIndex, setActivePreviewIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const appendInputRef = useRef<HTMLInputElement | null>(null)

  const config = typeConfig[activeType]
  const descriptionLimit = activeType === 'reel' ? 500 : 2200
  const canPublish =
    files.length > 0 &&
    !isPublishing &&
    (activeType === 'story' || description.length <= descriptionLimit)

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [files],
  )
  const activePreview = previews[activePreviewIndex] ?? previews[0]

  useEffect(
    () => () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url))
    },
    [previews],
  )

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isPublishing) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isPublishing, onClose])

  if (!isOpen) {
    return null
  }

  function resetDraft() {
    setStep('type')
    setActiveType('post')
    setFiles([])
    setDescription('')
    setHashtag('')
    setError(null)
    setIsDragging(false)
    setIsPublishing(false)
    setActivePreviewIndex(0)
  }

  function handleClose() {
    if (!isPublishing) {
      resetDraft()
      onClose()
    }
  }

  function handleSelectType(type: CreateType) {
    setActiveType(type)
    setFiles([])
    setDescription('')
    setHashtag('')
    setError(null)
    setActivePreviewIndex(0)
    setStep('upload')
  }

  function handleBack() {
    setError(null)

    if (step === 'upload') {
      setStep('type')
      return
    }

    if (step === 'details') {
      setStep('upload')
      return
    }

    if (step === 'success') {
      resetDraft()
    }
  }

  function applyFiles(
    nextFiles: FileList | File[],
    options: { append?: boolean } = {},
  ) {
    const incoming = Array.from(nextFiles)
    const shouldAppend = Boolean(options.append && activeType === 'post')
    const candidateFiles = shouldAppend ? [...files, ...incoming] : incoming

    if (incoming.length === 0) {
      return
    }

    if (candidateFiles.length > config.maxFiles) {
      setError(
        activeType === 'post'
          ? 'Для публикации можно выбрать до 10 файлов.'
          : 'Выберите один файл.',
      )
      return
    }

    const invalid = incoming.find((file) => !config.allowedTypes.includes(file.type))

    if (invalid) {
      setError(
        activeType === 'reel'
          ? 'Для Reels нужен mp4 файл.'
          : 'Поддерживаются jpg, png, webp и mp4.',
      )
      return
    }

    setFiles(candidateFiles)
    setActivePreviewIndex(shouldAppend ? files.length : 0)
    setError(null)
    setStep('details')
  }

  function removeFile(index: number) {
    const nextFiles = files.filter((_, fileIndex) => fileIndex !== index)

    setFiles(nextFiles)
    setActivePreviewIndex((current) =>
      Math.min(current, Math.max(nextFiles.length - 1, 0)),
    )

    if (nextFiles.length === 0) {
      setStep('upload')
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    applyFiles(event.dataTransfer.files)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canPublish) {
      return
    }

    setIsPublishing(true)
    setError(null)

    const cleanDescription = description.trim()
    const cleanHashtag = hashtag.trim()

    try {
      if (activeType === 'post') {
        await createPost({
          files,
          description: cleanDescription || undefined,
          hashtag: cleanHashtag || undefined,
        })
      } else if (activeType === 'reel') {
        await createReel({
          file: files[0],
          description: cleanDescription || undefined,
          hashtag: cleanHashtag || undefined,
        })
      } else {
        await createStory(files[0])
      }

      setStep('success')
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6">
      <section className="flex max-h-[92svh] w-full max-w-[780px] flex-col overflow-hidden rounded-lg border border-ig-border bg-ig-surface shadow-2xl">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-ig-border px-3">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-ig-muted transition hover:bg-ig-elevated hover:text-ig-text disabled:opacity-30"
            type="button"
            aria-label="Назад"
            disabled={step === 'type' || isPublishing}
            onClick={handleBack}
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-sm font-semibold">
            {step === 'success' ? 'Готово' : 'Создать'}
          </h2>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-ig-muted transition hover:bg-ig-elevated hover:text-ig-text disabled:opacity-30"
            type="button"
            aria-label="Закрыть"
            disabled={isPublishing}
            onClick={handleClose}
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto">
          {step === 'type' && (
            <div className="grid gap-3 p-5 sm:grid-cols-3">
              {(Object.keys(typeConfig) as CreateType[]).map((type) => {
                const Icon = typeConfig[type].icon

                return (
                  <button
                    className="flex h-40 flex-col items-center justify-center rounded-lg border border-ig-border bg-ig-bg text-center transition hover:border-ig-muted hover:bg-ig-elevated"
                    key={type}
                    type="button"
                    onClick={() => handleSelectType(type)}
                  >
                    <Icon size={38} strokeWidth={1.8} />
                    <span className="mt-4 text-base font-semibold">
                      {typeConfig[type].label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {step === 'upload' && (
            <div className="p-5">
              <div
                className={`flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center transition ${
                  isDragging
                    ? 'border-ig-primary bg-ig-primary/10'
                    : 'border-ig-border bg-ig-bg'
                }`}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-ig-border">
                  <Plus size={34} />
                </div>
                <h3 className="mt-5 text-xl font-semibold">
                  {config.label}
                </h3>
                <button
                  className="mt-5 rounded-lg bg-ig-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1877F2]"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  Выбрать с компьютера
                </button>
                <input
                  ref={inputRef}
                  className="hidden"
                  type="file"
                  accept={config.accept}
                  multiple={config.maxFiles > 1}
                  onChange={(event) => {
                    if (event.target.files) {
                      applyFiles(event.target.files)
                      event.target.value = ''
                    }
                  }}
                />
              </div>
              {error && (
                <p className="mt-4 rounded-sm border border-ig-danger/50 bg-ig-danger/10 px-3 py-2 text-sm text-ig-text">
                  {error}
                </p>
              )}
            </div>
          )}

          {step === 'details' && (
            <form
              className="grid min-h-[520px] md:grid-cols-[minmax(0,1fr)_320px]"
              onSubmit={handlePublish}
            >
              <div className="min-h-[340px] border-b border-ig-border bg-black md:border-b-0 md:border-r">
                {activePreview && (
                  <MediaPreview
                    className="max-h-[520px]"
                    file={activePreview.file}
                    url={activePreview.url}
                  />
                )}
                {(previews.length > 1 || activeType === 'post') && (
                  <div className="flex gap-2 overflow-x-auto border-t border-ig-border bg-ig-bg p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {previews.map((preview, index) => (
                      <button
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border transition ${
                          index === activePreviewIndex
                            ? 'border-ig-text'
                            : 'border-ig-border hover:border-ig-muted'
                        }`}
                        key={preview.url}
                        type="button"
                        onClick={() => setActivePreviewIndex(index)}
                      >
                        <MediaPreview file={preview.file} url={preview.url} />
                        {activeType === 'post' && files.length > 1 && (
                          <span
                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeFile(index)
                            }}
                          >
                            <X size={13} />
                          </span>
                        )}
                      </button>
                    ))}
                    {activeType === 'post' && files.length < config.maxFiles && (
                      <button
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm border border-dashed border-ig-border text-ig-muted transition hover:border-ig-muted hover:text-ig-text"
                        type="button"
                        aria-label="Добавить ещё файлы"
                        onClick={() => appendInputRef.current?.click()}
                      >
                        <Plus size={22} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {formatFilesLabel(files)}
                    </div>
                    {activeType === 'post' && (
                      <div className="mt-1 text-xs text-ig-muted">
                        {files.length}/{config.maxFiles} файлов
                      </div>
                    )}
                  </div>
                  {activeType === 'post' && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ig-elevated px-2.5 text-xs font-semibold transition hover:bg-[#2A2A2A] disabled:opacity-40"
                        type="button"
                        disabled={files.length >= config.maxFiles}
                        onClick={() => appendInputRef.current?.click()}
                      >
                        <Plus size={15} />
                        Ещё
                      </button>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-ig-elevated text-ig-muted transition hover:bg-[#2A2A2A] hover:text-ig-danger disabled:opacity-40"
                        type="button"
                        disabled={files.length <= 1}
                        aria-label="Удалить текущий файл"
                        onClick={() => removeFile(activePreviewIndex)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
                {activeType === 'post' && (
                  <input
                    ref={appendInputRef}
                    className="hidden"
                    type="file"
                    accept={config.accept}
                    multiple
                    onChange={(event) => {
                      if (event.target.files) {
                        applyFiles(event.target.files, { append: true })
                        event.target.value = ''
                      }
                    }}
                  />
                )}

                {activeType !== 'story' && (
                  <>
                    <textarea
                      className="mt-4 min-h-36 resize-none rounded-lg border border-ig-border bg-ig-bg px-3 py-3 text-sm outline-none placeholder:text-ig-faint focus:border-ig-faint"
                      maxLength={descriptionLimit}
                      placeholder="Напишите подпись..."
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                    />
                    <div className="mt-2 text-right text-xs text-ig-muted">
                      {description.length}/{descriptionLimit}
                    </div>
                    <input
                      className="mt-4 h-11 rounded-lg border border-ig-border bg-ig-bg px-3 text-sm outline-none placeholder:text-ig-faint focus:border-ig-faint"
                      placeholder="#hashtag"
                      value={hashtag}
                      onChange={(event) => setHashtag(event.target.value)}
                    />
                  </>
                )}

                {activeType === 'story' && (
                  <div className="mt-4 rounded-lg border border-ig-border bg-ig-bg px-3 py-3 text-sm text-ig-muted">
                    История будет доступна 24 часа.
                  </div>
                )}

                {error && (
                  <p className="mt-4 rounded-sm border border-ig-danger/50 bg-ig-danger/10 px-3 py-2 text-sm text-ig-text">
                    {error}
                  </p>
                )}

                <button
                  className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ig-primary px-4 text-sm font-semibold text-white transition hover:bg-[#1877F2] disabled:cursor-not-allowed disabled:opacity-45"
                  type="submit"
                  disabled={!canPublish}
                >
                  {isPublishing && (
                    <Loader2 className="animate-spin" size={17} />
                  )}
                  Опубликовать
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-ig-border">
                <Check size={42} />
              </div>
              <h3 className="mt-5 text-xl font-semibold">Опубликовано</h3>
              <button
                className="mt-6 rounded-lg bg-ig-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1877F2]"
                type="button"
                onClick={handleClose}
              >
                Закрыть
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
