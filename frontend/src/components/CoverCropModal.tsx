import { useCallback, useEffect, useRef, useState } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from './ui/button';
import { X } from 'lucide-react';

const ASPECT = 16 / 9;
const OUTPUT_WIDTH = 1280;
const PREVIEW_W = 160;
const PREVIEW_H = Math.round(PREVIEW_W / ASPECT);

function centerAspectCrop(mediaWidth: number, mediaHeight: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, ASPECT, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

function cropToBlob(image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<File> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const srcW = crop.width * scaleX;
  const srcH = crop.height * scaleY;
  const outW = Math.min(srcW, OUTPUT_WIDTH);
  const outH = Math.round(outW * (srcH / srcW));

  canvas.width = outW;
  canvas.height = outH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Could not get canvas context'));

  ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, srcW, srcH, 0, 0, outW, outH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
        const outName = fileName.replace(/\.[^.]+$/, '.jpg');
        resolve(new File([blob], outName, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92,
    );
  });
}

interface Props {
  file: File;
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
}

export function CoverCropModal({ file, onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [srcUrl, setSrcUrl] = useState('');

  // Create and revoke blob URL in the same effect to survive React StrictMode
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrcUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initial = centerAspectCrop(width, height);
    setCrop(initial);
    // Also set completedCrop so the button is enabled right away
    const { width: w, height: h } = e.currentTarget.getBoundingClientRect();
    // trigger a pixel crop from the percent crop
    setCompletedCrop({
      unit: 'px',
      x: w * 0.05,
      y: h * 0.05,
      width: w * 0.9,
      height: (w * 0.9) / ASPECT,
    });
  }, []);

  const handleConfirm = async () => {
    const img = imgRef.current;
    if (!img || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) return;
    setIsProcessing(true);
    try {
      const croppedFile = await cropToBlob(img, completedCrop, file.name);
      onConfirm(croppedFile);
    } catch (err) {
      console.error('Crop failed:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Обрезка обложки</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Перетащите и измените рамку — она задаёт область обложки (16:9)
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Crop area */}
        <div
          className="flex items-center justify-center overflow-auto bg-zinc-950 p-4"
          style={{ maxHeight: '60vh' }}
        >
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={ASPECT}
            minWidth={80}
            ruleOfThirds
          >
            <img
              ref={imgRef}
              src={srcUrl}
              alt="Превью обложки"
              style={{ maxHeight: '55vh', maxWidth: '100%', display: 'block' }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>

        {/* Preview strip */}
        {completedCrop && imgRef.current && (
          <div className="flex items-center gap-3 border-t px-5 py-3 bg-muted/30">
            <span className="text-xs text-muted-foreground shrink-0">Предпросмотр:</span>
            <CropPreview image={imgRef.current} crop={completedCrop} />
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-5 py-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            Отмена
          </Button>
          <Button
            type="button"
            disabled={!completedCrop || isProcessing}
            onClick={handleConfirm}
          >
            {isProcessing ? 'Обработка...' : 'Применить и загрузить'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CropPreview({ image, crop }: { image: HTMLImageElement; crop: PixelCrop }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !crop.width || !crop.height) return;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = PREVIEW_W;
    canvas.height = PREVIEW_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      PREVIEW_W,
      PREVIEW_H,
    );
  }, [image, crop]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded border border-input"
      style={{ width: PREVIEW_W, height: PREVIEW_H }}
    />
  );
}
