import type { Complexity, CustomFieldDefinition, ProductType, Scene } from './types';
import { FORMAT_SPECS, getSceneDetailVisibility } from './formatConfig';
import { isPresetVisible } from './customFields';

export type SceneStatus = 'complete' | 'partial' | 'empty';

interface StatusContext {
  productType: ProductType;
  complexity: Complexity;
  fieldDefinitions?: CustomFieldDefinition[];
}

/**
 * Stand einer Szene für Prüfen- und Export-Schritt. Nur Felder zählen, die im
 * aktuellen Format und Detailgrad sichtbar sind. Bild-Formate brauchen für
 * "complete" zusätzlich ein Bild.
 */
export function getSceneStatus(
  scene: Scene,
  hasImage: boolean,
  context: StatusContext,
): SceneStatus {
  const { productType, complexity, fieldDefinitions } = context;
  const visible = getSceneDetailVisibility(productType, complexity);
  const hasVisibleCustomContent = (fieldDefinitions ?? []).some(
    (definition) =>
      isPresetVisible(definition.key, productType, complexity) &&
      !!scene.customFields?.[definition.key]?.trim(),
  );
  const hasContent =
    !!scene.title?.trim() ||
    !!scene.action?.trim() ||
    !!scene.text?.trim() ||
    !!scene.audio?.dialogue?.trim() ||
    (visible.soundEffects && !!scene.audio?.soundEffects?.trim()) ||
    (visible.location && !!scene.location?.trim()) ||
    (visible.cameraSize && !!(scene.camera?.shotSize?.trim() || scene.camera?.angle?.trim())) ||
    (visible.cameraMovement && !!scene.camera?.movement?.trim()) ||
    (visible.materials && !!scene.materials?.length) ||
    hasVisibleCustomContent;

  if (hasContent && (hasImage || !FORMAT_SPECS[productType].hasImage)) return 'complete';
  if (hasImage || hasContent) return 'partial';
  return 'empty';
}

/** Es gibt Szenen und keine davon ist ganz leer. */
export function hasNoEmptyScenes(
  scenes: Scene[],
  imageUrls: Record<string, string>,
  context: StatusContext,
): boolean {
  return (
    scenes.length > 0 &&
    scenes.every((scene) => getSceneStatus(scene, !!imageUrls[scene.id], context) !== 'empty')
  );
}
