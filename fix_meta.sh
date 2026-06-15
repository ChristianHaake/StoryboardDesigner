#!/bin/bash
FILES=(
  "src/app/store/useStoryboardStore.test.ts"
  "src/app/store/useStoryboardStore.ts"
  "src/domain/customFields.ts"
  "src/domain/projectCodec.ts"
  "src/domain/templates.ts"
  "src/features/editor/EditorView.tsx"
  "src/features/editor/FormatTabs.tsx"
  "src/shared/ui/FieldConfigDialog.tsx"
  "src/shared/utils/persistence.test.ts"
  "src/shared/utils/zipHandler.test.ts"
)

for file in "${FILES[@]}"; do
  perl -pi -e 's/formatType/productType/g' "$file"
  perl -pi -e 's/participants: '\''Testbeteiligte'\''/groupMembers: ['\''Testbeteiligte'\''], topic: '\'''\'', complexity: '\''standard'\''/g' "$file"
  perl -pi -e 's/participants: '\'''\''/groupMembers: [], topic: '\'''\'', complexity: '\''standard'\''/g' "$file"
  perl -pi -e 's/participants: '\''Test'\''/groupMembers: ['\''Test'\''], topic: '\'''\'', complexity: '\''standard'\''/g' "$file"
  perl -pi -e 's/participants\?/groupMembers\?/g' "$file"
  perl -pi -e 's/participants/groupMembers/g' "$file"
done

# specific fixes for templates.ts
perl -pi -e 's/groupMembers: \[\]/groupMembers: [], topic: '\'''\'', complexity: '\''standard'\''/g' src/domain/templates.ts

