import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import {
  ChevronLeft,
  ChevronRight,
  X,
  LayoutTemplate,
  Play,
  Pause,
  MessageSquare,
  Video,
} from 'lucide-react';

export default function PresentationView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scenes = useStoryboardStore((s) => s.scenes);
  const imageUrls = useStoryboardStore((s) => s.imageUrls);
  const fieldDefinitions = useStoryboardStore((s) => s.fieldDefinitions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const totalScenes = scenes.length;
  const currentScene = scenes[currentIndex];

  useEffect(() => {
    let timer: number;
    if (isPlaying && currentScene) {
      const durationMs = 3000;
      timer = window.setTimeout(() => {
        if (currentIndex < totalScenes - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, durationMs);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, currentScene, totalScenes]);

  useEffect(() => {
    if (currentIndex >= totalScenes && totalScenes > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentIndex(totalScenes - 1);
    }
  }, [totalScenes, currentIndex]);

  const handleNext = () => {
    setIsPlaying(false);
    if (currentIndex < totalScenes - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsPlaying(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleExit = () => {
    navigate('/');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExit();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, totalScenes]); // Re-bind on index change so handlers have fresh state

  if (totalScenes === 0) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-900 text-slate-100">
        <LayoutTemplate className="mb-4 h-16 w-16 text-slate-600" strokeWidth={1} />
        <h2 className="mb-2 text-xl font-medium">{t('presentation.emptyTitle')}</h2>
        <p className="mb-8 text-slate-400">{t('presentation.emptyDesc')}</p>
        <button
          onClick={handleExit}
          className="rounded-lg bg-slate-800 px-6 py-2.5 font-medium transition-colors hover:bg-slate-700"
        >
          {t('presentation.exit')}
        </button>
      </div>
    );
  }

  if (!currentScene) return null;

  const imageUrl = imageUrls[currentScene.id];

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-950 text-slate-50">
      {/* Top Bar Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-slate-950/80 to-transparent">
        <div className="rounded-full bg-slate-900/60 px-3 py-1 text-sm font-medium tabular-nums text-slate-300 backdrop-blur-sm">
          {currentIndex + 1} / {totalScenes}
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/60 text-slate-300 backdrop-blur-sm transition-colors hover:bg-slate-800 hover:text-white"
            aria-label={isPlaying ? t('presentation.pause') : t('presentation.play')}
            title={isPlaying ? t('presentation.pause') : t('presentation.play')}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" strokeWidth={2} />
            ) : (
              <Play className="h-5 w-5 ml-1" strokeWidth={2} />
            )}
          </button>
          <button
            onClick={handleExit}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/60 text-slate-300 backdrop-blur-sm transition-colors hover:bg-slate-800 hover:text-white"
            title={t('presentation.exit')}
            aria-label={t('presentation.exit')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Image Section */}
        <div className="relative flex flex-1 items-center justify-center p-8 pb-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={currentScene.altText || ''}
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            />
          ) : (
            <div className="flex aspect-video w-full max-w-3xl items-center justify-center rounded-lg border-2 border-dashed border-slate-800 bg-slate-900/50">
              <span className="text-slate-600">{t('scene.noImage')}</span>
            </div>
          )}
        </div>

        {/* Text Section */}
        <div className="flex shrink-0 flex-col items-center p-8 pt-4">
          <div className="w-full max-w-4xl space-y-4">
            {currentScene.text && (
              <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-4 border border-slate-700/50">
                <MessageSquare className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                <p className="text-xl leading-relaxed text-slate-100">{currentScene.text}</p>
              </div>
            )}
            {currentScene.action && (
              <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-4 border border-slate-700/50">
                <Video className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                <div>
                  <h3 className="mb-1 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    {t('presentation.action')}
                  </h3>
                  <p className="text-xl leading-relaxed text-slate-100 italic">
                    {currentScene.action}
                  </p>
                </div>
              </div>
            )}

            {currentScene.audio?.dialogue && (
              <FieldBlock label={t('presentation.dialogue')} value={currentScene.audio.dialogue} />
            )}
            {(currentScene.audio?.soundEffects || currentScene.audio?.music) && (
              <FieldBlock
                label={t('presentation.sound')}
                value={[currentScene.audio.soundEffects, currentScene.audio.music]
                  .filter(Boolean)
                  .join(' · ')}
              />
            )}
            {(currentScene.camera?.shotSize ||
              currentScene.camera?.angle ||
              currentScene.camera?.movement) && (
              <FieldBlock
                label={t('presentation.camera')}
                value={[
                  currentScene.camera.shotSize,
                  currentScene.camera.angle,
                  currentScene.camera.movement,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            )}
            {currentScene.location && (
              <FieldBlock label={t('presentation.location')} value={currentScene.location} />
            )}
            {currentScene.materials?.length ? (
              <FieldBlock
                label={t('presentation.materials')}
                value={currentScene.materials.join(', ')}
              />
            ) : null}

            {/* Custom Fields — nur Felder mit aktiver Definition, mit Label. */}
            {currentScene.customFields &&
              (fieldDefinitions ?? []).map((definition) => {
                const value = currentScene.customFields?.[definition.key];
                if (!value) return null;
                return (
                  <div key={definition.key}>
                    <h3 className="mb-1 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      {definition.label}
                    </h3>
                    <p className="text-lg leading-relaxed text-slate-300">{value}</p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Navigation Overlays */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/80 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-slate-800 disabled:opacity-0"
          aria-label={t('presentation.prev')}
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4">
        <button
          onClick={handleNext}
          disabled={currentIndex === totalScenes - 1}
          className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/80 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-slate-800 disabled:opacity-0"
          aria-label={t('presentation.next')}
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
}

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold tracking-wider text-slate-500 uppercase">
        {label}
      </h3>
      <p className="text-lg leading-relaxed text-slate-300">{value}</p>
    </div>
  );
}
