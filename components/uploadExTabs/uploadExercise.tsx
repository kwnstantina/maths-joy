import { Form, useLoaderData } from "@remix-run/react";
import Alerts from "components/alerts/alerts";
import { Category, TAGS, Type } from "services/models/models";
import FormField from "../formField/formField";

type Props = {
  handleSubmit: any;
  onChangeHandler: any;
  uploadData: any;
  actionData: any;
  buttonState: string;
  fileUploadHandler: (evt: any) => void;
};

const UploadExercise = (props: Props) => {
  const {
    handleSubmit,
    onChangeHandler,
    uploadData,
    actionData,
    buttonState,
    fileUploadHandler,
  } = props;
  return (
    <>
      <div className="mx-auto w-full max-w-lg  p-5 h-94 mt-5 mb-4 bg-gray-100 mb-20 rounded py-94">
        <Form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            htmlFor={"title"}
            label={"Επιλογή Τάξης"}
            value={uploadData.title}
            error={actionData?.errors?.title}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"select"}
            listCategories={Object.values(TAGS.byId)}
            onChange={onChangeHandler}
            required
            placeholder={"Τάξη..."}
          />
          <FormField
            htmlFor={"category"}
            label={"Επιλογή Κατηγορίας"}
            value={uploadData.category}
            error={actionData?.errors?.category}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"select"}
            listCategories={Object.values(Category.byId)}
            onChange={onChangeHandler}
            required
            placeholder={"Κατηγορία..."}
          />
          <FormField
            htmlFor={"tags"}
            label={"Επιλογή τύπου ασκήσεως"}
            value={uploadData.tags}
            error={actionData?.errors?.tags}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"select"}
            listCategories={Object.values(Type.byId)}
            onChange={onChangeHandler}
            required
            placeholder={"Τύπος άσκησης..."}
          />
          <FormField
            htmlFor={"exercise"}
            type="file"
            name="exercise"
            label={"Ανέβασμα Ασκησης"}
            error={actionData?.errors?.exercise}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"input"}
            required
            id="exercise"
            accept="image/*, .xlsx, .xls, .csv, .pdf, .pptx, .pptm, .ppt"
            onChange={(event) => fileUploadHandler(event)}
          />
          <FormField
            htmlFor={"solution"}
            type="file"
            name="solution"
            label={"Λύση"}
            error={actionData?.errors?.solution}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"input"}
            required
            id="exercise"
            accept="image/*, .xlsx, .xls, .csv, .pdf, .pptx, .pptm, .ppt"
            onChange={(event) => fileUploadHandler(event)}
          />
       <FormField
            htmlFor={"searchableTitle"}
            label={"Τίτλος"}
            value={uploadData.searchableTitle}
            error={actionData?.errors?.searchableTitle}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"input"}
            onChange={onChangeHandler}
            required
            placeholder={""}
            name={"searchableTitle"}
          />
          <button
            value="upload"
            name="_uploadTraining"
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

export default UploadExercise;
