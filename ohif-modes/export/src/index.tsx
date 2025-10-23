import toolbarButtons from "./toolbarButtons";
import { id } from './id';
import i18n from 'i18next';

const configs = {
  Length: {},
  //
};

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
};

const cs3d = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-custom-export': '^0.0.1'
};

function modeFactory() {
  return {
    id,
    routeName: 'export',
    displayName: i18n.t('Modes:Export'),
    /**
     * Lifecycle hooks
     */
    onModeEnter: ({ servicesManager, extensionManager }: any) => {
       console.log('Export Mode initialized');
       const { toolbarService } = servicesManager.services;
       toolbarService.register(toolbarButtons);
       toolbarService.updateSection(toolbarService.sections.primary, ['ExportViewport']);

    },
    onModeExit: ({ servicesManager }: any) => { 
      console.log("Exiting export mode ");
      const {toolbarService, uiDialogService, uiModalService,} = servicesManager.services;
      uiDialogService.hideAll();
      uiModalService.hide();
      toolbarService.hide();
    },
    validationTags: {study: [],series: [],
    },
    isValidMode: () => ({ valid: true, description: '' }),
    routes: [
      {
        path: 'viewer',
        layoutTemplate: () => ({
          id: ohif.layout,
          props: {
            leftPanels: [ohif.thumbnailList],
            leftPanelResizable: true,
            rightPanels: [],
            rightPanelResizable: false,
            viewports: [
              {
                namespace: cs3d.viewport,
                displaySetsToDisplay: [ohif.sopClassHandler],
              },
            ],
          },
        }),
      },
    ],
    extensions: extensionDependencies,
    hangingProtocol: 'default',
    sopClassHandlers: [ohif.sopClassHandler],
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
