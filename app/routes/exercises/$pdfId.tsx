import { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getExersiceById } from "~/utils/exersices.prisma";
import { Worker, Viewer,RotateDirection } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import type { ToolbarProps } from "@react-pdf-viewer/default-layout";
import React, { useState } from "react";
import coreCss from "@react-pdf-viewer/core/lib/styles/index.css";
import layoutCss from "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { RenderRotateProps, rotatePlugin } from '@react-pdf-viewer/rotate';


export const links = () => [
  { rel: "stylesheet", href: coreCss },
  { rel: "stylesheet", href: layoutCss },
];
export const loader: LoaderFunction = async ({ request, params }) => {
  const { pdfId } = params;
  const pdf = await getExersiceById(pdfId);
  return pdf;
};

export default function PdfContainer() {
  const data = useLoaderData();
  const [isDisabled, setIsDisabled] = useState(true) as any;
  const [pageNumber, setPageNumber] = useState<number>(1);

  const pageNavigationPluginInstance = pageNavigationPlugin();

  const renderToolbar = (
    Toolbar: (props: ToolbarProps) => React.ReactElement
  ) => (
    <>
      <Toolbar>
        {(toolbarSlot) => {
          const {
            Download,
            ZoomIn,
            ZoomOut,
            CurrentScale,
            GoToPreviousPage,
            CurrentPageInput,
            NumberOfPages,
            GoToNextPage,
            Rotate,
            SwitchTheme,
            EnterFullScreen,
          } = toolbarSlot;
          return (
            <>  
             <div className="ml-8">
              <SwitchTheme />
              </div>
              <div className="mr-8">
              <EnterFullScreen />   
              </div>

             
            
              <ZoomOut />   
              <CurrentScale />
              <div className="mr-8">
              <ZoomIn />
              </div>
              
              <Rotate direction={RotateDirection.Backward}/>
              <Rotate direction={RotateDirection.Forward}/>
             

              <GoToPreviousPage />
              <CurrentPageInput />
              <NumberOfPages />
              <GoToNextPage />
                     
              <Download>
                {(
                  props:any
                ) => (
                  <button
                    style={{
                      backgroundColor: isDisabled ? "#96ccff" : "#357edd",
                      border: "none",
                      borderRadius: "10px",
                      color: "#ffffff",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      padding: "8px",
                      margin: "10px"
                    }}
                    disabled={isDisabled}
                    onClick={props.onClick}
                  >
                    Download 
                  </button>
                  )
                }
              </Download>     
            </>
          );
        }}
      </Toolbar>
    </>
  );
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderToolbar,
  });

  return (
    <div className="container mx-auto px-6 text-center pb-52 mt-10">
      <h2 className="text-center pb-10">
        <strong>{data.title}</strong>{" "}
      </h2>
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js">
        <div style={{ height: "90rem" }}>
          <Viewer
            fileUrl={data?.fileContentType}
            plugins={[
              pageNavigationPluginInstance,
              defaultLayoutPluginInstance,
            ]}
            initialPage={pageNumber}
          />
        </div>
      </Worker>
    </div>
  );
}
