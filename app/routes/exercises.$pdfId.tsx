import { LoaderFunction, data } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getExersiceById } from "~/utils/exersices.prisma";
import { Worker, Viewer, RotateDirection } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import type { ToolbarProps } from "@react-pdf-viewer/default-layout";
import React, { useState } from "react";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";

// Type for PDF data
interface PdfData {
  title: string;
  fileContentType?: string | null;
  cloudinaryUrl?: string | null;
  cloudinaryPublicId?: string | null;
  fileSize?: number | null;
  translation?: unknown;
}


export const loader: LoaderFunction = async ({ params }) => {
  const { pdfId } = params;
  const pdf = await getExersiceById(pdfId);

  if (!pdf) {
    throw new Response("PDF not found", { status: 404 });
  }

  return data(pdf);
};

export default function PdfContainer() {
  const data = useLoaderData<PdfData>();
  const [isDisabled] = useState(true);
  const [pageNumber] = useState<number>(1);

  // Use Cloudinary URL if available, otherwise fall back to base64
  const pdfUrl = data.cloudinaryUrl || data.fileContentType || '';

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
                {(props: { onClick: () => void }) => (
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
                )}
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
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <div style={{ height: "90rem" }}>
          {pdfUrl ? (
            <Viewer
              fileUrl={pdfUrl}
              plugins={[
                pageNavigationPluginInstance,
                defaultLayoutPluginInstance,
              ]}
              initialPage={pageNumber}
            />
          ) : (
            <div className="text-center text-red-500 py-10">
              PDF not available
            </div>
          )}
        </div>
      </Worker>
    </div>
  );
}
