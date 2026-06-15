#!/bin/bash
FILES=(
  "src/app/store/useStoryboardStore.test.ts"
  "src/domain/projectCodec.test.ts"
  "src/shared/utils/persistence.test.ts"
  "src/shared/utils/zipHandler.test.ts"
)

NEW_PROPS="title: '', action: '', text: '', audio: { dialogue: '', soundEffects: '', music: '' }, camera: { shotSize: '', angle: '', movement: '' }, duration: 0, location: '', materials: [], roles: [], transition: '', sources: [], reflection: '',"

for file in "${FILES[@]}"; do
  perl -pi -e "s/audioText: '',/$NEW_PROPS/g" "$file"
  perl -pi -e "s/directorNotes: '',//g" "$file"
done

# Fix UI files manually
