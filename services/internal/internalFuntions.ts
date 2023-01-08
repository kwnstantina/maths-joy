const InternalFunctions={} as any;

InternalFunctions.getBase64 = (file:  Blob | any) => {
  return new Promise(resolve => {
    let fileInfo: any;
    let baseURL:any = "";
    // Make new FileReader
    let reader = new FileReader();
    // Convert the file to base64 text
    reader.readAsDataURL(file);

    // on reader load somthing...
    reader.onload = () => {
      // Make a fileInfo Object
      baseURL = reader.result;
      resolve({
        fileContentType:baseURL,
        fileFileName:file?.name,
        fileSize:file?.size,
      });
    };
  });
};


export default InternalFunctions;