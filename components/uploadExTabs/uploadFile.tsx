import { Form } from "@remix-run/react";
import Alerts from "components/alerts/alerts";
import { Category, TAGS, Type } from "services/models/models";
import FormField from "../formField/formField";

type Props={
    handleSubmit:any;
    onChangeHandler:any;
    uploadData:any
    actionData:any
    fileUploadHandler:any
    buttonState:string

};
const UploadFile = (props:Props) => {
  const {handleSubmit,onChangeHandler,uploadData,actionData,fileUploadHandler,buttonState} =props;
  return (
    <>
    <div className="mx-auto w-full max-w-md p-5 h-94 mt-5 mb-4 bg-gray-100 mb-20 rounded py-94">
    <Form  onSubmit={handleSubmit} className="space-y-6">
      <FormField
        htmlFor={"title"}
        label={"Τάξη"}
        value={uploadData.title}
        error={actionData?.errors?.title}
        labelStyle={"block text-sm font-medium text-gray-700"}
        typeOfField={"select"}
        listCategories={TAGS}
        onChange={onChangeHandler}
        required
      />
     <FormField
        htmlFor={"category"}
        label={"Επιλογή Κατηγορίας"}
        value={uploadData.category}
        error={actionData?.errors?.category}
        labelStyle={"block text-sm font-medium text-gray-700"}
        typeOfField={"select"}
        listCategories={Category}
        onChange={onChangeHandler}
        required
      />
    <FormField
        htmlFor={"tags"}
        label={" Επιλογή αρχείου"}
        value={uploadData.tags}
        error={actionData?.errors?.tags}
        labelStyle={"block text-sm font-medium text-gray-700"}
        typeOfField={"select"}
        listCategories={Type}
        onChange={onChangeHandler}
        required
  
      />
         <FormField
        htmlFor={"file_input"}
        type='file'
        name="file"
        label={"Τύπος άσκησης"}
        error={actionData?.errors?.tags}
        labelStyle={"block text-sm font-medium text-gray-700"}
        typeOfField={"input"}
        required
        id="file_input"
        accept=".pdf"
        onChange={(event) => fileUploadHandler(event)}
      />
     <button
           value="upload"
               name="_uploadExercise"
               type="submit"
               className="w-full mb-4 rounded bg-orange-500  py-2 px-4 text-white hover:bg-orange-600 focus:bg-orange-400"
             >
            {buttonState}
           </button>
      </Form>
      {actionData?.error && <Alerts.ErrorAlert error={actionData.error} />}
      </div>
    </>
  );
};

export default UploadFile;
