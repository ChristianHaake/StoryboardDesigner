#!/bin/bash
FILES=(
  "src/app/store/useStoryboardStore.test.ts"
  "src/app/store/useStoryboardStore.ts"
  "src/domain/customFields.test.ts"
  "src/domain/customFields.ts"
  "src/domain/projectCodec.ts"
  "src/domain/templates.ts"
  "src/features/editor/EditorView.tsx"
  "src/features/editor/FormatTabs.tsx"
  "src/features/editor/TemplatePicker.tsx"
  "src/shared/ui/FieldConfigDialog.tsx"
  "src/shared/utils/persistence.test.ts"
  "src/shared/utils/zipHandler.test.ts"
)

for file in "${FILES[@]}"; do
  perl -pi -e "s/'film'/'shortFilm'/g" "$file"
  perl -pi -e 's/"film"/"shortFilm"/g' "$file"
  perl -pi -e "s/film:/shortFilm:/g" "$file"
  perl -pi -e "s/format\.film/format.shortFilm/g" "$file"
done

# Fix projectCodec.ts array mapping
perl -pi -e "s/groupMembers: str\(obj\.groupMembers\)/groupMembers: typeof obj.groupMembers === 'string' ? [obj.groupMembers] : Array.isArray(obj.groupMembers) ? obj.groupMembers.map(str) : []/g" src/domain/projectCodec.ts
perl -pi -e "s/groupMembers: str\(obj\.participants\)/groupMembers: typeof obj.participants === 'string' ? [obj.participants] : []/g" src/domain/projectCodec.ts

# Fix EditorView.tsx
perl -pi -e "s/groupMembers: e\.target\.value/groupMembers: [e.target.value]/g" src/features/editor/EditorView.tsx

