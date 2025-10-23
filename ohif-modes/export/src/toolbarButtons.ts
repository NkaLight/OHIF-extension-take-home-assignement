import type { Button } from '@ohif/core/types';
import i18n from 'i18next';

const toolbarButtons: Button[] = [
  {
    id: 'ExportViewport',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'Export',
      label: i18n.t('Buttons:Export', 'Export'),
      tooltip: i18n.t('Buttons:Export Current Viewport', 'Export Current Viewport'),
      commands: "exportViewport",
    },
  },
];

export default toolbarButtons;
