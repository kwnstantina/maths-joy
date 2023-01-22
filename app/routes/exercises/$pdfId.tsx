
import { LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import {getExersiceById} from '~/utils/exersices.prisma';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import type { ToolbarProps } from '@react-pdf-viewer/default-layout'
import React, { useState } from "react";
import coreCss from '@react-pdf-viewer/core/lib/styles/index.css'
import layoutCss from '@react-pdf-viewer/default-layout/lib/styles/index.css';
import {
  pageNavigationPlugin,
} from "@react-pdf-viewer/page-navigation";


export const links = () => [
  { rel: 'stylesheet', href: coreCss },
  { rel: 'stylesheet', href: layoutCss },
]
export const loader: LoaderFunction = async ({ request, params }) => {  
  const { pdfId } = params;
  const pdf=await getExersiceById(pdfId ) 
  return  pdf
}

export default function PdfContainer() {
  const data = useLoaderData();
  const [numPages, setNumPages] = useState(null) as any;
  const [pageNumber, setPageNumber] = useState<number>(1);

  const pageNavigationPluginInstance = pageNavigationPlugin();
  const renderToolbar = (
    Toolbar: (props: ToolbarProps) => React.ReactElement,
  ) => (
    <>
      <Toolbar   

    />
      {/* <div
       
      >
        Custom element
      </div> */}
    </>
  )
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderToolbar,
  }) 

  return (
    <div className="container mx-auto px-6 text-center pb-52" >   
      <h2><strong>{data.title}</strong> </h2>
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js">
      <div style={{height:'90rem'}}>
      <Viewer 
      fileUrl={data?.fileContentType}  
      plugins={[pageNavigationPluginInstance,defaultLayoutPluginInstance]}
      initialPage={pageNumber}
      />
       </div>
    </Worker>
   
          
  </div>
  )
}

