## Take Home assignment
<strong>Name: </strong> Nkanyiso Owethu Ndlovu


#### see official documentation
[Official ohif documentation](https://github.com/OHIF/Viewers?tab=readme-ov-file)

## GOAL:
- Create a custom mode, using standard OHIF documentation to hold the toolbar button, and also initialise the custom extension.
- Create a custom extension to run a command when the user clicks on the export button, when the custom mode is active to export the current viewport as a jpeg image along with the metadata as a zip file. 


## How to run the project
1. 
```bash
git clone https://github.com/NkaLight/OHIF-extension-take-home-assignement.git
```
2. 
```bash
cd ./OHIF-extension-take-home-assignement/

# Enable Yarn Workspaces
yarn config set workspaces-experimental true

#Restore dependencies
yarn install 

#Optionally relink custom mode and custom extension
yarn cli link-mode ./ohif-modes/export
yarn cli link-mode ./ohif-extensions/custom-export

#Start server
yarn dev:fast
```   

### To activate the mode
To do this simply
1. navigate to localhost:port/
2. From the home page click on any study
3. From there you will see an Icon <strong>Export</strong>, click on it(Activates the Export Mode)
4. From there click on export icon at the primary section.
5. That will initiate the exporting functionality and you will see UI notifications.

## Reflections:
- ### Development Process:
  1. <strong>Reading documentation:</strong> to understand OHIF v3 architecture to understood the distinct roles of 
     - Modes (defining UI,context, consuming extensions) 
     - Extensions for implementing the logic, and 
     - Services for accessing viewer state and calling reusable ui components such as the notification service.
  2. <strong>Custom mode</strong>: a container for the custom export functionality. Defined a <strong>Toolbar</strong> to house the export button, to be rendered in the primary section. The export button, when clicked would trigger the  `exportViewport` command. Ensured the custom extension was listed as required in the custom mode.
  3. <strong>Custom Extension</strong>: This is the central function that implements the business requirements, the `exportViewport` command executes the functionality.
     - Get html snapshot of current viewport  convert to a canvas and then convert to a jpeg image blob.
     - Get the metadata for the image, through the use of displaySetService and viewportGridService. 
     - Once we have the metadata and image blob we wrap that in a zip file stored in temp file, that we then download. All client side.  

- ### Challenges:
  - Main challenges was configuration management, whilst the documentation did specify node version above 18, at version 19, the version I had I heard errors. I experimented with running the project as a container in docker, but ultimately I found that it was more efficient, to manage my versions of node with nvm natively.
  - Inconsistencies with documentaton and code examples found online from other external sources, so I moved to looking through this interanl project directly to see how other extensions where implemented, to avoid following outdated design patterns.

### Assumptions:
-  Assumptions I made was that all images in the current viewport can be rendered using the `cornerstone` extension. Given more time, I would have made my export mode more robust to render other types of images too, or not render any images at all. 
-  Assumptions I also made was that the pattern html-> canvas-> imageblob, will sufficiently generate high-quality images. Since it is essentially a screenshot of the current viewport, more native api could result in better fidelity of the current viewport, this is something I would have experimented with further in the future.Perhaps identified any trade-offs.

