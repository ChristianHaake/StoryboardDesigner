import { useTranslation } from 'react-i18next';
import { useStoryboardStore } from '../../app/store/useStoryboardStore';
import type { ProductType } from '../../domain/types';
import {
  Video,
  MonitorPlay,
  Camera,
  Headphones,
  Mic,
  Scissors,
  PenTool,
  Smartphone,
  Users,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function StartScreen() {
  const { t } = useTranslation();
  const setWizardStep = useStoryboardStore((s) => s.setWizardStep);
  const updateMetaData = useStoryboardStore((s) => s.updateMetaData);

  const selectProduct = (product: ProductType) => {
    updateMetaData({ productType: product });
    setWizardStep('setup');
  };

  const TILES: { type: ProductType; icon: React.ElementType; title: string; desc: string }[] = [
    { type: 'shortFilm', icon: Video, title: t('format.shortFilm'), desc: 'Spielfilm, Dokumentation oder Reportage' },
    { type: 'explainerVideo', icon: MonitorPlay, title: t('format.explainerVideo'), desc: 'Wissen vermitteln mit Animationen' },
    { type: 'fotostory', icon: Camera, title: t('format.fotostory'), desc: 'Geschichte in Bildern mit Sprechblasen' },
    { type: 'audioPlay', icon: Headphones, title: t('format.audioPlay'), desc: 'Szenisches Hörspiel mit Geräuschen' },
    { type: 'podcast', icon: Mic, title: t('format.podcast'), desc: 'Interview, Diskussion oder Reportage' },
    { type: 'stopMotion', icon: Scissors, title: t('format.stopMotion'), desc: 'Objekte Bild für Bild zum Leben erwecken' },
    { type: 'comic', icon: PenTool, title: t('format.comic'), desc: 'Gezeichnete Bildabfolge' },
    { type: 'socialMediaClip', icon: Smartphone, title: t('format.socialMediaClip'), desc: 'Kurzformat für Social Media' },
    { type: 'roleplay', icon: Users, title: t('format.roleplay'), desc: 'Bühnenstück oder szenisches Spiel' },
    { type: 'custom', icon: Sparkles, title: t('format.custom'), desc: 'Freies Format nach eigener Idee' },
  ];

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="mb-14 text-center mt-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mb-6">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>Storyboard Creator</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mb-6">
          Was möchtest du <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">erstellen?</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-500 sm:text-xl leading-relaxed">
          Wähle dein Medienprodukt, um das passende Storyboard zu starten und deine Ideen systematisch zu planen.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.type}
              onClick={() => selectProduct(tile.type)}
              className="group relative flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:border-blue-500 hover:shadow-md hover:ring-1 hover:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="flex w-full items-center justify-between">
                <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-600 ring-1 ring-inset ring-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:text-blue-500 group-hover:translate-x-1" />
              </div>
              <div className="mt-5">
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                  {tile.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  {tile.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
