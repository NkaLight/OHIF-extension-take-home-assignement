import { id } from './id';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';

const sanitize = (s?: string) =>
  (s || 'Unknown').toString().replace(/[^\w\-]+/g, '_').slice(0, 60);

/**
 * You can remove any of the following modules if you don't need them.
 */
export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   * You ID can be anything you want, but it should be unique.
   */
  id,

  /**
   * Perform any pre-registration tasks here. This is called before the extension
   * is registered. Usually we run tasks such as: configuring the libraries
   * (e.g. cornerstone, cornerstoneTools, ...) or registering any services that
   * this extension is providing.
   */
  preRegistration: ({ servicesManager, commandsManager, configuration = {} }) => {
  },

  /**
   * CommandsModule should provide a list of commands that will be available in OHIF
   * for Modes to consume and use in the viewports. Each command is defined by
   * an object of { actions, definitions, defaultContext } where actions is an
   * object of functions, definitions is an object of available commands, their
   * options, and defaultContext is the default context for the command to run against.
   */
getCommandsModule: ({ servicesManager }) => {
    const {
      viewportGridService,
      displaySetService,
      uiNotificationService,
    } = servicesManager.services;

    /** Helpers **/
    const getViewportElement = (viewportId: string): HTMLElement | null => {
      // Generic selectors used by OHIF for viewport wrappers
      return (
        (document.querySelector(`[data-viewport-uid="${viewportId}"]`) as HTMLElement) ||
        null
      );
    };

    const captureDomToCanvas = async (el: HTMLElement): Promise<HTMLCanvasElement> => {
      return await html2canvas(el, {
        useCORS: true,
        backgroundColor: null,
        logging: false,
        scale: 1,
      });
    };

    const canvasToJpegBlob = async (canvas: HTMLCanvasElement, quality = 1.00): Promise<Blob> =>
      await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), 'image/jpeg', quality)
      );

    const buildMetadata = (viewPortId:string)=>{
      const dsUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewPortId);
      const dsUID = dsUIDs[0];
      if (!dsUID) {
        throw new Error(`No display set found for viewport ${viewPortId}`);
      }

      const ds = displaySetService.getDisplaySetByUID(dsUID);
      if (!ds) {
        throw new Error(`Display set ${dsUID} not found`);
      }

      const inst = ds.instances[0];

      //Get the PatientName, StudyDate, StudyISO(incl time)
      const patientName = inst.PatientName;
      const studyDateRaw = inst.StudyDate;

      console.log(inst)

      return {
        PatientName: patientName,
        StudyDate: studyDateRaw
      }
      
    }

    const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    /** Command **/

    return {
      definitions: {
        exportViewport: {
          commandFn: async () => {
            try {
              // 1) Active viewport
              const viewportId:string| undefined = viewportGridService.getActiveViewportId?.();
              if(!viewportId) throw new Error("No active viewport");

              // 2) DOM wrapper
              const el = getViewportElement(viewportId);
              if (!el) throw new Error(`Viewport element not found for id: ${viewportId}`);

              // 3) Snapshot DOM → canvas → JPEG
              const canvas = await captureDomToCanvas(el);
              const imageBlob = await canvasToJpegBlob(canvas);

              // 4) Metadata
              const md = buildMetadata(viewportId);
              const metadataJson = JSON.stringify(md, null, 2);

              // 5) ZIP: image.jpg + metadata.json
              const zip = new JSZip();
              zip.file('image.jpg', imageBlob);
              zip.file('metadata.json', metadataJson);
              const zipBlob = await zip.generateAsync({
                type: 'blob'
              });

              // 6) Download
              const filename = `report_${md.PatientName}_${md.StudyDate}.zip`;
              downloadBlob(zipBlob, filename);

              uiNotificationService?.show?.({
                title: 'Export complete',
                message: `Downloaded ${filename}`,
                type: 'success',
              });
            } catch (error: any) {
              console.error(error);
              uiNotificationService?.show?.({
                title: 'Export failed',
                message: error?.message || 'Unexpected error',
                type: 'error',
              });
            }
          },
          options: {},
        },
      },
      defaultContext: 'DEFAULT',
    };
  }
};
