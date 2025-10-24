import { id } from './id';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';

/**
 * You can remove any of the following modules if you don't need them.
 */
export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   * You ID can be anything you want, but it should be unique.
   */
  id,

  getCommandsModule: ({ servicesManager }) => {
      const {
        viewportGridService,
        displaySetService,
        uiNotificationService,
      } = servicesManager.services;

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
        console.log(inst);
        //Get the PatientName, StudyDate, StudyISO(incl time)
        const patientName = inst.PatientName ?? 'N/A';
        const patientSex  = inst.PatientSex ?? "N/A";
        const patientPosition = inst.PatientPosition ?? "N/A";
        const studyDateRaw = inst.StudyDate ?? 'N/A';
        const mrn = inst.MRN ?? 'N/A'; 
        const description = inst.StudyDescription ?? 'N/A';

        return {
          PatientName: patientName,
          PatientSex: patientSex,
          PatientPosition: patientPosition,
          StudyDate: studyDateRaw,
          MRN: mrn,
          Description: description
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
                uiNotificationService?.show?.({
                  title: 'Downloading...',
                });
                // 1) Get active viewportId
                const viewportId:string| undefined = viewportGridService.getActiveViewportId?.();
                if(!viewportId) throw new Error("No active viewport");

                // 2) Get the html element for the viewport
                const el:HTMLElement|null =  document.querySelector(`[data-viewport-uid="${viewportId}"]`);
                if (!el) throw new Error(`Viewport element not found for id: ${viewportId}`);

                // 3) Convert DOM to Canvas & canvas to JpegBlob
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
