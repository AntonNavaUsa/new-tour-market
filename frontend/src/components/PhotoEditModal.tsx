import { useCallback, useEffect, useRef, useState } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from './ui/button';
import { RotateCcw, RotateCw, X } from 'lucide-react';

const OUTPUT_MAX = 1920;

function centerDefaultCrop(mediaWidth: number, mediaHeight: number, aspectRatio?: number): Crop {
  if (aspectRatio) {
    return centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspectRatio, mediaWidth, mediaHeight),
      mediaWidth,
      mediaHeight,
    );
  }
  return { unit: '%', x: 5, y: 5, width: 90, height: 90 };
}

function rotateImage(srcUrl: string, degrees: number): Promise<string> {
  if (degrees === 0) return Promise.resolve(srcUrl);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const rad = (degrees * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const outW = Math.round(w * cos + h * sin);
      const outH = Math.round(w * sin + h * cos);

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }
      ctx.save();
      ctx.translate(outW / 2, outH / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -w / 2, -h / 2);
      ctx.restore();

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(URL.createObjectURL(blob));
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        0.95,
      );
    };
    img.onerror = reject;
    img.src = srcUrl;
  });
}

function cropToBlob(image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<File> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const srcW = crop.width * scaleX;
  const srcH = crop.height * scaleY;
  const outW = Math.min(srcW, OUTPUT_MAX);
  const outH = Math.round(outW * (srcH / srcW));

  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('No canvas context'));
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
  aspectRatio?: number;
  title?: string;
  onConfirm: (editedFile: File) => void;
  onCancel: () => void;
}

export function PhotoEditModal({ file, aspectRatio, title, onConfirm, onCancel }: Props) {
  const [rotation, setRotation] = useState(0);
  const [originalSrc, setOriginalSrc] = useState('');
  const [displaySrc, setDisplaySrc] = useState('');
  const [isRotating, setIsRotating] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const rotatedBlobsRef = useRef<string[]>([]);

  // Create initial blob URL from file; revoke all on cleanup
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const blobs: string[] = [];
    rotatedBlobsRef.current = blobs;
    setOriginalSrc(url);
    setDisplaySrc(url);
    setRotation(0);
    setCrop(undefined);
    setCompletedCrop(undefined);
    return () => {
      URL.revokeObjectURL(url);
      blobs.forEach(URL.revokeObjectURL);
    };
  }, [file]);

  // Derive displaySrc from originalSrc + rotation
  useEffect(() => {
    if (!originalSrc) return;
    if (rotation === 0) {
      setDisplaySrc(originalSrc);
      setCrop(undefined);
      setCompletedCrop(undefined);
      return;
    }
    let cancelled = false;
    setIsRotating(true);
    rotateImage(originalSrc, rotation)
      .then((url) => {
        if (cancelled) { URL.revokeObjectURL(url); return; }
        rotatedBlobsRef.current.push(url);
        setDisplaySrc(url);
        setCrop(undefined);
        setCompletedCrop(undefined);
        setIsRotating(false);
      })
      .catch(() => { if (!cancelled) setIsRotating(false); });
    return () => { cancelled = true; };
  }, [originalSrc, rotation]);

  const handleRotate = (dir: 'cw' | 'ccw') => {
    setRotation((prev) => ((dir === 'cw' ? prev + 90 : prev - 90) + 360) % 360);
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const initial = centerDefaultCrop(width, height, aspectRatio);
      setCrop(initial);
      if (aspectRatio) {
        setCompletedCrop({
          unit: 'px',
          x: width * 0.05,
          y: height * 0.05,
          width: width * 0.9,
          height: (width * 0.9) / aspectRatio,
        });
      } else {
        setCompletedCrop({
          unit: 'px',
          x: width * 0.05,
          y: height * 0.05,
          width: width * 0.9,
          height: height * 0.9,
        });
      }
    },
    [aspectRatio],
  );

  const handleConfirm = async () => {
    const img = imgRef.current;
    if (!img || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) return;
    setIsProcessing(true);
    try {
      const croppedFile = await cropToBlob(img, completedCrop, file.name);
      onConfirm(croppedFile);
    } catch (err) {
      console.error('Photo edit failed:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">{title ?? 'Редактирование фото'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Поверните изображение и выберите область кадрирования
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Rotation controls */}
        <div className="flex items-center gap-2 border-b px-5 py-2 bg-muted/20">
          <span className="text-xs text-muted-foreground mr-1">Поворот:</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRotate('ccw')}
            disabled={isRotating || isProcessing}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            −90°
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRotate('cw')}
            disabled={isRotating || isProcessing}
          >
            <RotateCw className="h-4 w-4 mr-1" />
            +90°
          </Button>
          <span className="text-xs text-muted-foreground ml-2 tabular-nums">
            {rotation}°
          </span>
        </div>

        {/* Crop area */}
        <div
          className="flex items-center justify-center overflow-auto bg-zinc-950 p-4"
          style={{ maxHeight: '60vh' }}
        >
          {isRotating ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : displaySrc ? (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              minWidth={40}
              ruleOfThirds
            >
              <img
                ref={imgRef}
                src={displaySrc}
                alt="Редактирование фото"
                style={{ maxHeight: '55vh', maxWidth: '100%', display: 'block' }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-5 py-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            Отмена
          </Button>
          <Button
            type="button"
            disabled={!completedCrop || isProcessing || isRotating}
            onClick={handleConfirm}
          >
            {isProcessing ? 'Обработка...' : 'Применить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
