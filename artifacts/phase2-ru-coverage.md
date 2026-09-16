# Phase 2 Russian UI coverage

## Measurement

Measured after the implementation commit with a lexical scan of the TypeScript locale objects and localized option records. The scan counts non-empty quoted string values under every `ru:` property; technical identifiers and preserved language names are included when they are user-facing option values.

- Frontend files scanned: 47
- Files changed in implementation commit: 58
- Files containing Russian locale/option records: 47
- Russian properties found: 54
- Non-empty Russian string entries: 1462
- Comparable zh string entries: 1459
- Comparable en string entries: 1461

## Files touched

- `frontend/src/components/history/ProjectCard.tsx`
- `frontend/src/components/outline/OutlineCard.tsx`
- `frontend/src/components/preview/DescriptionCard.tsx`
- `frontend/src/components/preview/PagePropertiesDrawer.tsx`
- `frontend/src/components/preview/SlideCard.tsx`
- `frontend/src/components/preview/SlidePlayer.tsx`
- `frontend/src/components/settings/DataStorageSettings.tsx`
- `frontend/src/components/shared/AccessCodeGuard.tsx`
- `frontend/src/components/shared/AiRefineInput.tsx`
- `frontend/src/components/shared/ConfirmDialog.tsx`
- `frontend/src/components/shared/DesktopTitleBar.tsx`
- `frontend/src/components/shared/ExportTasksPanel.tsx`
- `frontend/src/components/shared/FilePreviewModal.tsx`
- `frontend/src/components/shared/Footer.tsx`
- `frontend/src/components/shared/HelpModal.tsx`
- `frontend/src/components/shared/ImagePreviewList.tsx`
- `frontend/src/components/shared/MarkdownTextarea.tsx`
- `frontend/src/components/shared/MaterialCenterModal.tsx`
- `frontend/src/components/shared/MaterialGeneratorModal.tsx`
- `frontend/src/components/shared/MaterialSelector.tsx`
- `frontend/src/components/shared/Modal.tsx`
- `frontend/src/components/shared/Pagination.tsx`
- `frontend/src/components/shared/PresetCapsules.tsx`
- `frontend/src/components/shared/ProjectResourcesList.tsx`
- `frontend/src/components/shared/ProjectSettingsModal.tsx`
- `frontend/src/components/shared/ReferenceFileCard.tsx`
- `frontend/src/components/shared/ReferenceFileList.tsx`
- `frontend/src/components/shared/ReferenceFileSelector.tsx`
- `frontend/src/components/shared/StatusBadge.tsx`
- `frontend/src/components/shared/TemplateSelector.tsx`
- `frontend/src/components/shared/TextStyleSelector.tsx`
- `frontend/src/components/shared/UpdateChecker.tsx`
- `frontend/src/components/template/SwitchToSingleModeDialog.tsx`
- `frontend/src/components/template/TemplateAnalysisEditor.tsx`
- `frontend/src/components/template/TemplateMatchProgress.tsx`
- `frontend/src/components/template/TemplatePickerModal.tsx`
- `frontend/src/config/presetStylesI18n.ts`
- `frontend/src/hooks/useImagePaste.ts`
- `frontend/src/hooks/usePageStatus.ts`
- `frontend/src/hooks/useT.ts`
- `frontend/src/i18n.ts`
- `frontend/src/locales/ru.json`
- `frontend/src/pages/DetailEditor.tsx`
- `frontend/src/pages/History.tsx`
- `frontend/src/pages/Home.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/OutlineEditor.tsx`
- `frontend/src/pages/Settings.tsx`
- `frontend/src/pages/SlidePreview.tsx`
- `frontend/src/pages/TemplateSetupPage.tsx`
- `frontend/src/store/useExportTasksStore.ts`
- `frontend/src/store/useProjectStore.ts`
- `frontend/src/tests/components/DescriptionCard.test.tsx`
- `frontend/src/tests/utils.i18nHelper.test.ts`
- `frontend/src/utils/extraFieldLabels.ts`
- `frontend/src/utils/i18nHelper.ts`
- `frontend/src/utils/index.ts`
- `frontend/src/utils/projectUtils.ts`
