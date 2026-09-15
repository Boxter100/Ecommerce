import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { createBrowserSupabase } from '../../lib/supabase/browser';
import { isSupabaseConfigured } from '../../lib/env';
import {
  IMAGE_BUCKET,
  IMAGE_MIME,
  IMAGE_SIZE,
  fileToSquareWebp,
  uniqueImagePath,
  validateImageFile,
} from '../../lib/images';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
}

export default function ImageUploader({
  images,
  onChange,
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const newPathsRef = useRef<Map<string, string>>(new Map());
  const depthRef = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    const accepted: File[] = [];
    const problems: string[] = [];

    for (const file of list) {
      const problem = validateImageFile(file);
      if (problem) problems.push(`${file.name}: ${problem}`);
      else accepted.push(file);
    }

    if (accepted.length === 0) {
      setError(problems.join(' · ') || 'Archivo no válido');
      return;
    }
    setError(problems.length > 0 ? problems.join(' · ') : null);
    setUploading(true);

    try {
      const supabase = createBrowserSupabase();
      const added: string[] = [];

      for (const file of accepted) {
        const blob = await fileToSquareWebp(file);
        const path = uniqueImagePath();
        const { error: uploadError } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(path, blob, {
            contentType: IMAGE_MIME,
            cacheControl: '31536000',
            upsert: false,
          });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
        newPathsRef.current.set(data.publicUrl, path);
        added.push(data.publicUrl);
      }

      onChange([...images, ...added]);
    } catch (e) {
      setError(
        e instanceof Error
          ? `No se pudo subir la imagen: ${e.message}`
          : 'No se pudo subir la imagen',
      );
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    const path = newPathsRef.current.get(url);
    if (path) {
      newPathsRef.current.delete(url);
      const supabase = createBrowserSupabase();
      void supabase.storage.from(IMAGE_BUCKET).remove([path]);
    }
    onChange(images.filter((image) => image !== url));
  }

  function openPicker() {
    if (disabled || uploading) return;
    inputRef.current?.click();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  }

  function onDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    depthRef.current += 1;
    setDragging(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    depthRef.current -= 1;
    if (depthRef.current <= 0) {
      depthRef.current = 0;
      setDragging(false);
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    depthRef.current = 0;
    setDragging(false);
    if (disabled || uploading) return;
    void handleFiles(e.dataTransfer.files);
  }

  const zoneClass = `flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
    dragging
      ? 'border-ember bg-ember/10'
      : 'border-line dark:border-line-dark'
  } ${disabled || uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-ember/60'}`;

  return (
    <div>
      <span className="text-xs font-bold uppercase tracking-wider text-ink/60 dark:text-paper/60">
        Imágenes · WebP
      </span>
      <p className="mt-1 text-xs text-ink/40 dark:text-paper/40">
        {IMAGE_SIZE} × {IMAGE_SIZE} px · recorte cuadrado automático · solo .webp
      </p>

      <div
        role="button"
        tabIndex={0}
        aria-label="Subir imágenes en formato WebP"
        aria-disabled={disabled || uploading}
        onClick={openPicker}
        onKeyDown={onKeyDown}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`mt-3 ${zoneClass}`}
      >
        <svg
          aria-hidden="true"
          className="h-8 w-8 text-ember"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="text-sm font-semibold">
          {uploading
            ? 'Subiendo imágenes…'
            : 'Arrastra imágenes aquí o haz clic para elegirlas'}
        </p>
        <p className="text-xs text-ink/40 dark:text-paper/40">
          Formato .webp · máx. 10 MB por archivo
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".webp,image/webp"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-ember">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-3">
          {images.map((url, index) => (
            <li key={url} className="relative">
              <img
                src={url}
                alt={`Imagen ${index + 1}`}
                className="h-20 w-20 rounded-xl border border-line object-cover dark:border-line-dark"
              />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-ember px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Principal
                </span>
              )}
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => removeImage(url)}
                aria-label={`Quitar imagen ${index + 1}`}
                className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border border-line bg-paper text-ink shadow transition-colors hover:bg-ember hover:text-white dark:border-line-dark dark:bg-ink-2 dark:text-paper"
              >
                <svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!isSupabaseConfigured() && (
        <p className="mt-2 text-xs text-ink/40 dark:text-paper/40">
          Conecta Supabase para poder subir imágenes a Storage.
        </p>
      )}
    </div>
  );
}