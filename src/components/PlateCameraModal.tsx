import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
  ZapOff,
  Crosshair,
  Shield,
  Clock,
  Edit3,
  RotateCcw,
  Check,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react';
import { PlateSegments } from '../types';
import { scanPlateFromImage, preloadPlateWorker } from '../utils/plateScanner';
import { triggerHaptic } from '../utils/haptics';

interface PlateCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlateDetected: (plate: PlateSegments) => void;
}

export const PlateCameraModal: React.FC<PlateCameraModalProps> = ({
  isOpen,
  onClose,
  onPlateDetected,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [detectedPlate, setDetectedPlate] = useState<PlateSegments | null>(null);
  const [isEditingPlate, setIsEditingPlate] = useState(false);
  const [editSegments, setEditSegments] = useState<PlateSegments>({ city: '34', letters: 'ABC', digits: '123' });
  const [scanTimestamp, setScanTimestamp] = useState<string>('');
  const [confidenceScore, setConfidenceScore] = useState<number>(98);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<string>('1.0X');
  const [aspectSize, setAspectSize] = useState<'standard' | 'wide'>('standard');

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preload worker as soon as modal opens or mounts
  useEffect(() => {
    preloadPlateWorker();
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      setStream(null);
    }
    setIsTorchOn(false);
    setHasTorch(false);
  }, [stream]);

  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);
    setIsTorchOn(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage('Kamera erişimi desteklenmiyor. Fotoğraf yükleyerek devam edebilirsiniz.');
        return;
      }

      let mediaStream: MediaStream | null = null;

      // 1. Prioritize primary 1X rear back camera on mobile/iPhone
      if (cameraFacing === 'environment') {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((d) => d.kind === 'videoinput');

          const primaryBackCamera =
            videoDevices.find((d) => {
              const label = d.label.toLowerCase();
              return (
                (label.includes('back') || label.includes('rear') || label.includes('arka')) &&
                !label.includes('wide') &&
                !label.includes('ultra') &&
                !label.includes('tele') &&
                !label.includes('0.5')
              );
            }) ||
            videoDevices.find((d) => {
              const label = d.label.toLowerCase();
              return (
                (label.includes('back') || label.includes('rear') || label.includes('arka')) &&
                !label.includes('ultra') &&
                !label.includes('0.5')
              );
            });

          if (primaryBackCamera && primaryBackCamera.deviceId) {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: { exact: primaryBackCamera.deviceId },
                width: { ideal: 1280, max: 1280 },
                height: { ideal: 720, max: 720 },
                frameRate: { ideal: 30, max: 30 },
              },
              audio: false,
            });
          }
        } catch {}
      }

      // 2. High-speed smooth 720p environment constraints fallback
      if (!mediaStream) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: cameraFacing === 'environment' ? { ideal: 'environment' } : 'user',
              width: { ideal: 1280, max: 1280 },
              height: { ideal: 720, max: 720 },
              frameRate: { ideal: 30, max: 30 },
            },
            audio: false,
          });
        } catch {
          // 3. Basic facingMode
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraFacing },
            audio: false,
          });
        }
      }

      // 4. Force 1X zoom & continuous focus
      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
          const constraintsToApply: any = {};

          if (capabilities.torch) {
            setHasTorch(true);
          }

          if (capabilities.zoom) {
            const minZoom = capabilities.zoom.min || 1;
            const targetZoom = Math.max(minZoom, 1.0);
            constraintsToApply.zoom = targetZoom;
            setZoomLevel(`${targetZoom.toFixed(1)}X`);
          } else {
            setZoomLevel('1.0X');
          }

          if (
            capabilities.focusMode &&
            Array.isArray(capabilities.focusMode) &&
            capabilities.focusMode.includes('continuous')
          ) {
            constraintsToApply.focusMode = 'continuous';
          }

          if (Object.keys(constraintsToApply).length > 0 && track.applyConstraints) {
            await track.applyConstraints({ advanced: [constraintsToApply] }).catch(() => {});
          }
        } catch {}
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setErrorMessage('Kamera otomatik başlatılamadı. Fotoğraf yükleyerek plakayı okuyabilirsiniz.');
    }
  }, [cameraFacing, stopCamera]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setErrorMessage(null);
      setDetectedPlate(null);
      setIsEditingPlate(false);
      return;
    }

    setCameraFacing('environment');
    startCamera();
    preloadPlateWorker();

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const toggleCameraFacing = () => {
    triggerHaptic('selection');
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
      triggerHaptic('medium');
    } catch {
      setIsTorchOn(false);
    }
  };

  const toggleAspectSize = () => {
    triggerHaptic('selection');
    setAspectSize((prev) => (prev === 'standard' ? 'wide' : 'standard'));
  };

  const processImageForPlate = async (imageSource: string | File) => {
    setIsScanning(true);
    setScanProgress(25);
    setErrorMessage(null);
    triggerHaptic('medium');

    try {
      const result = await scanPlateFromImage(imageSource, (progress) => {
        setScanProgress(progress);
      });

      // Format current timestamp: DD.MM.YYYY • HH:mm
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setScanTimestamp(`${day}.${month}.${year} • ${hours}:${mins}`);

      if (result.success && result.plate) {
        triggerHaptic('success');
        setConfidenceScore(result.confidence || 98);
        setDetectedPlate(result.plate);
        setEditSegments(result.plate);
      } else {
        triggerHaptic('warning');
        setErrorMessage(
          result.errorMessage || 'Plaka okunamadı. Plakayı sarı çerçevenin ortasına tam hizalayıp tekrar deneyin.'
        );
      }
    } catch {
      triggerHaptic('error');
      setErrorMessage('Tarama esnasında bir hata meydana geldi. Lütfen tekrar deneyin.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCapturePhoto = () => {
    triggerHaptic('selection');
    if (!videoRef.current) return;
    const video = videoRef.current;
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;

    // 1. Capture display image (downsampled for lightweight memory)
    const displayCanvas = document.createElement('canvas');
    const displayW = Math.min(vw, 960);
    const displayH = Math.round((vh / vw) * displayW);
    displayCanvas.width = displayW;
    displayCanvas.height = displayH;
    const displayCtx = displayCanvas.getContext('2d');

    let fullDataUrl = '';
    if (displayCtx) {
      displayCtx.drawImage(video, 0, 0, displayW, displayH);
      fullDataUrl = displayCanvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(fullDataUrl);
    }
    stopCamera();

    // 2. Focused Center Crop for instant OCR (just the reticle area, 20x faster!)
    try {
      const cropCanvas = document.createElement('canvas');
      const cropX = Math.round(vw * 0.1);
      const cropY = Math.round(vh * 0.3);
      const cropW = Math.round(vw * 0.8);
      const cropH = Math.round(vh * 0.4);

      cropCanvas.width = 550;
      cropCanvas.height = Math.round((cropH / cropW) * 550);
      const cropCtx = cropCanvas.getContext('2d');

      if (cropCtx) {
        cropCtx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropCanvas.width, cropCanvas.height);
        const cropDataUrl = cropCanvas.toDataURL('image/jpeg', 0.9);
        processImageForPlate(cropDataUrl);
        return;
      }
    } catch {}

    // Fallback to full image if crop fails
    processImageForPlate(fullDataUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
      processImageForPlate(file);
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    triggerHaptic('selection');
    setCapturedImage(null);
    setDetectedPlate(null);
    setIsEditingPlate(false);
    setErrorMessage(null);
    startCamera();
  };

  const handleConfirmPlate = () => {
    triggerHaptic('success');
    const plateToUse = isEditingPlate ? editSegments : (detectedPlate || editSegments);
    onPlateDetected(plateToUse);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#080a0c]/98 flex flex-col justify-between items-center p-0 sm:p-4 select-none animate-in fade-in duration-150 transform-gpu">
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Container */}
      <div className="w-full h-full sm:h-auto sm:max-h-[96vh] max-w-md bg-[#111315] text-white rounded-none sm:rounded-3xl border-0 sm:border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between relative transform-gpu will-change-transform">
        
        {/* ========================================================================= */}
        {/* STATE A: ACTIVE CAMERA SCANNER (Layout from IMG_3082.png in App Colors)   */}
        {/* ========================================================================= */}
        {!detectedPlate ? (
          <>
            {/* Top Bar */}
            <div className="pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 px-5 flex items-center justify-between border-b border-white/5 bg-[#111315]/90 backdrop-blur-md z-30">
              {/* Close Button (Left) */}
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer active:scale-95"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Centered Title */}
              <div className="text-center">
                <span className="font-extrabold text-sm tracking-wide text-white">
                  Plaka Taraması
                </span>
              </div>

              {/* Right Controls: Torch & Camera Switch */}
              <div className="flex items-center gap-1.5">
                {hasTorch && (
                  <button
                    onClick={toggleTorch}
                    title={isTorchOn ? 'Flaş Kapat' : 'Flaş Aç'}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                      isTorchOn
                        ? 'bg-[#d8ff35] text-black shadow-[0_0_15px_rgba(216,255,53,0.5)]'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                  </button>
                )}

                <button
                  onClick={toggleCameraFacing}
                  title="Kamerayı Çevir"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewfinder Area */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden min-h-[380px]">
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Taranan Araç"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover"
                />
              )}

              {/* Viewfinder Vignette Shade */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)]" />

              {/* Scanning Reticle Frame (L-shaped corners in Plakala neon #d8ff35) */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div
                  className={`relative transition-all duration-300 flex items-center justify-center ${
                    aspectSize === 'wide'
                      ? 'w-[92%] max-w-[340px] h-[140px]'
                      : 'w-[86%] max-w-[310px] h-[110px]'
                  }`}
                >
                  {/* Top-Left Corner Bracket */}
                  <div className="absolute -top-1 -left-1 w-9 h-9 border-t-[3.5px] border-l-[3.5px] border-[#d8ff35] rounded-tl-2xl shadow-[0_0_12px_rgba(216,255,53,0.4)]" />
                  
                  {/* Top-Right Corner Bracket */}
                  <div className="absolute -top-1 -right-1 w-9 h-9 border-t-[3.5px] border-r-[3.5px] border-[#d8ff35] rounded-tr-2xl shadow-[0_0_12px_rgba(216,255,53,0.4)]" />
                  
                  {/* Bottom-Left Corner Bracket */}
                  <div className="absolute -bottom-1 -left-1 w-9 h-9 border-b-[3.5px] border-l-[3.5px] border-[#d8ff35] rounded-bl-2xl shadow-[0_0_12px_rgba(216,255,53,0.4)]" />
                  
                  {/* Bottom-Right Corner Bracket */}
                  <div className="absolute -bottom-1 -right-1 w-9 h-9 border-b-[3.5px] border-r-[3.5px] border-[#d8ff35] rounded-br-2xl shadow-[0_0_12px_rgba(216,255,53,0.4)]" />

                  {/* Horizontal Glowing Scanning Laser Beam (traversing vertically) */}
                  <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d8ff35] to-transparent shadow-[0_0_14px_#d8ff35] animate-[scanLaser_2.2s_ease-in-out_infinite]" />
                </div>

                {/* Floating Guide Badge below reticles (matching IMG_3082.png in App Colors) */}
                <div className="mt-5 px-4 py-2 rounded-full bg-black/75 backdrop-blur-md border border-[#d8ff35]/30 text-white text-xs font-semibold flex items-center gap-2 shadow-xl shadow-black/50 animate-in fade-in">
                  <div className="w-5 h-5 rounded-full bg-[#d8ff35]/15 text-[#d8ff35] flex items-center justify-center">
                    <Crosshair className="w-3.5 h-3.5" />
                  </div>
                  <span className="tracking-tight">Plakayı çerçevenin içine hizalayın</span>
                </div>
              </div>

              {/* AI Processing Scanning Overlay */}
              {isScanning && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6 z-20 animate-in fade-in">
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-[#d8ff35]/20 border-t-[#d8ff35] animate-spin" />
                    <Sparkles className="w-6 h-6 text-[#d8ff35] absolute animate-pulse" />
                  </div>
                  <div className="text-center">
                    <div className="font-black text-sm text-[#d8ff35] tracking-wider uppercase">
                      Yapay Zeka Okuyor
                    </div>
                    <div className="text-xs text-zinc-300 mt-1 font-medium">
                      Karakterler çözümleniyor (%{scanProgress})
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message Strip */}
            {errorMessage && (
              <div className="mx-4 my-2 p-3 rounded-2xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5 shadow-lg">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="font-medium leading-tight">{errorMessage}</span>
              </div>
            )}

            {/* Bottom Controls Area (Concentric Shutter + 3 Tools as in IMG_3082.png) */}
            <div className="pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] px-6 bg-[#0c0e10] border-t border-white/5 flex flex-col items-center">
              
              {/* Concentric Glowing Shutter Button */}
              <div className="my-2 flex items-center justify-center">
                <button
                  onClick={handleCapturePhoto}
                  disabled={!stream || isScanning}
                  className="relative group p-2 cursor-pointer active:scale-95 transition-transform disabled:opacity-40"
                  title="Fotoğrafı Çek"
                >
                  {/* Outermost Pulsing Glow Ring */}
                  <div className="absolute inset-0 rounded-full bg-[#d8ff35]/20 blur-md group-hover:bg-[#d8ff35]/30 transition-all animate-pulse" />
                  
                  {/* Middle Defined Neon Ring */}
                  <div className="w-20 h-20 rounded-full border-2 border-[#d8ff35]/80 flex items-center justify-center relative p-1.5 shadow-[0_0_16px_rgba(216,255,53,0.3)]">
                    
                    {/* Inner Solid Shutter Circle */}
                    <div className="w-full h-full rounded-full bg-[#d8ff35] hover:bg-[#c9f518] text-[#111315] flex items-center justify-center shadow-lg transition-colors">
                      <Camera className="w-7 h-7 fill-current" />
                    </div>
                  </div>
                </button>
              </div>

              {/* 3 Bottom Tools: Düzenle / Boyutlandır / Kaldır */}
              <div className="w-full grid grid-cols-3 gap-2 pt-2">
                {/* 1. Düzenle (Galeriden seç veya manuel düzenle) */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-1.5 py-1 text-zinc-400 hover:text-white transition-colors cursor-pointer group active:scale-95"
                >
                  <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 group-hover:border-white/20 flex items-center justify-center text-zinc-200">
                    <Upload className="w-5 h-5 group-hover:text-[#d8ff35] transition-colors" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-tight text-zinc-300">
                    Düzenle
                  </span>
                </button>

                {/* 2. Boyutlandır (Çerçeve boyutunu / odak alanını değiştir) */}
                <button
                  onClick={toggleAspectSize}
                  className="flex flex-col items-center justify-center gap-1.5 py-1 text-zinc-400 hover:text-white transition-colors cursor-pointer group active:scale-95"
                >
                  <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 group-hover:border-white/20 flex items-center justify-center text-zinc-200">
                    <Maximize2 className="w-5 h-5 group-hover:text-[#d8ff35] transition-colors" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-tight text-zinc-300">
                    Boyutlandır
                  </span>
                </button>

                {/* 3. Kaldır (Kapat / İptal) */}
                <button
                  onClick={onClose}
                  className="flex flex-col items-center justify-center gap-1.5 py-1 text-zinc-400 hover:text-white transition-colors cursor-pointer group active:scale-95"
                >
                  <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 group-hover:border-white/20 flex items-center justify-center text-zinc-200">
                    <RotateCcw className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-tight text-zinc-300">
                    Kaldır
                  </span>
                </button>
              </div>

            </div>
          </>
        ) : (
          /* ========================================================================= */
          /* STATE B: DETECTION RESULT SCREEN (Layout from IMG_3083.png in App Colors)  */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col justify-between overflow-y-auto">
            
            {/* Top Bar with Brand Badge & AI Ready status */}
            <div className="pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 px-5 flex items-center justify-between border-b border-white/5 bg-[#111315]/90 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRetake}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Geri Dön"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Brand Logo & Name */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 rounded bg-[#d8ff35] flex items-center justify-center text-black font-black font-mono text-[10px] shadow-sm">
                    TR
                  </div>
                  <span className="font-extrabold text-sm tracking-wide text-white">
                    PLAKA <span className="text-[#d8ff35]">AI</span>
                  </span>
                </div>
              </div>

              {/* AI Ready Status Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d8ff35]/15 border border-[#d8ff35]/30">
                <div className="w-2 h-2 rounded-full bg-[#d8ff35] animate-pulse" />
                <span className="text-[11px] font-bold text-[#d8ff35] tracking-wide">
                  AI Ready
                </span>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-5 space-y-4">
              
              {/* 1. Success Notification Card ("Plaka Algılandı!") */}
              <div className="p-4 rounded-2xl bg-[#16191e] border border-white/10 flex items-center gap-3.5 shadow-md">
                <div className="w-11 h-11 rounded-full bg-[#d8ff35] text-black flex items-center justify-center shrink-0 shadow-[0_0_18px_rgba(216,255,53,0.35)]">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white tracking-tight leading-tight">
                    Plaka Algılandı!
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">
                    İşlem başarıyla tamamlandı
                  </p>
                </div>
              </div>

              {/* 2. Large Realistic Turkish License Plate Display Card */}
              <div className="p-3 rounded-2xl bg-[#0c0e10] border border-white/10 shadow-xl flex flex-col items-center">
                <div className="w-full h-18 bg-white rounded-xl border-3 border-zinc-900 shadow-inner flex items-stretch overflow-hidden select-none">
                  
                  {/* Turkish Blue TR Band with Flag Crescent/Star & TR */}
                  <div className="w-11 bg-[#1e4fc2] flex flex-col items-center justify-between py-1.5 px-1 shrink-0 text-white">
                    {/* Mini Turkish Flag Crescent & Star */}
                    <div className="w-5 h-3.5 bg-[#e30a17] rounded-xs flex items-center justify-center text-[8px] font-bold leading-none shadow-xs">
                      <span className="text-white text-[9px] -mt-0.5">C*</span>
                    </div>
                    <span className="font-mono font-black text-xs tracking-wider">
                      TR
                    </span>
                  </div>

                  {/* Main Embossed License Plate Characters */}
                  <div className="flex-1 flex items-center justify-center px-4 font-mono-plate font-black text-3xl sm:text-4xl text-[#111315] tracking-widest drop-shadow-[0_1px_0px_rgba(255,255,255,0.8)]">
                    {isEditingPlate ? (
                      <div className="flex items-center gap-2 text-xl sm:text-2xl w-full">
                        <input
                          type="text"
                          maxLength={2}
                          value={editSegments.city}
                          onChange={(e) => setEditSegments({ ...editSegments, city: e.target.value.replace(/\D/g, '') })}
                          className="w-12 text-center bg-zinc-100 border border-zinc-300 rounded font-black text-black uppercase"
                        />
                        <input
                          type="text"
                          maxLength={4}
                          value={editSegments.letters}
                          onChange={(e) => setEditSegments({ ...editSegments, letters: e.target.value.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, '').toUpperCase() })}
                          className="w-20 text-center bg-zinc-100 border border-zinc-300 rounded font-black text-black uppercase"
                        />
                        <input
                          type="text"
                          maxLength={5}
                          value={editSegments.digits}
                          onChange={(e) => setEditSegments({ ...editSegments, digits: e.target.value.replace(/\D/g, '') })}
                          className="w-20 text-center bg-zinc-100 border border-zinc-300 rounded font-black text-black uppercase"
                        />
                      </div>
                    ) : (
                      `${detectedPlate.city} ${detectedPlate.letters} ${detectedPlate.digits}`
                    )}
                  </div>
                </div>

                {/* Inline Edit Toggle Pill */}
                <button
                  onClick={() => setIsEditingPlate(!isEditingPlate)}
                  className="mt-2.5 text-[11px] font-semibold text-[#d8ff35] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  {isEditingPlate ? 'Düzenlemeyi Bitir' : 'Karakterleri Elle Düzelt'}
                </button>
              </div>

              {/* 3. Detail Metadata Group Card (as in IMG_3083.png) */}
              <div className="rounded-2xl bg-[#16191e] border border-white/10 divide-y divide-white/5 overflow-hidden shadow-sm">
                
                {/* Row 1: Ülke */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🇹🇷</span>
                    <span className="text-xs font-semibold text-zinc-300">Türkiye</span>
                  </div>
                  <span className="text-xs font-bold text-zinc-400">TR Plaka</span>
                </div>

                {/* Row 2: Güven Skoru */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[#d8ff35]">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-300">Güven skoru</span>
                  </div>
                  <span className="text-xs font-black font-mono text-[#d8ff35]">
                    %{confidenceScore}
                  </span>
                </div>

                {/* Row 3: Tarama Zamanı */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-300">Tarama zamanı</span>
                  </div>
                  <span className="text-xs font-medium text-zinc-300 font-mono">
                    {scanTimestamp}
                  </span>
                </div>

                {/* Row 4: Kamera Kaynağı */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-300">Kamera kaynağı</span>
                  </div>
                  <span className="text-xs font-bold text-zinc-400">
                    Arka Kamera (1.0X)
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Actions Bar on Result Screen */}
            <div className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-[#0c0e10] border-t border-white/5 flex items-center gap-3">
              {/* Retake Button */}
              <button
                onClick={handleRetake}
                className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
                title="Tekrar Tara"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Primary Action Button: "Plakayı Kullan" */}
              <button
                onClick={handleConfirmPlate}
                className="flex-1 h-14 rounded-full bg-[#d8ff35] hover:bg-[#c9f518] text-[#111315] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-[0_0_25px_rgba(216,255,53,0.35)] cursor-pointer"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>Plakayı Kullan & Devam Et</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
