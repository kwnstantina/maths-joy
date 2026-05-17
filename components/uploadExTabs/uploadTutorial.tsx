import { Form } from "@remix-run/react";
import Alerts from "components/alerts/alerts";
import { Category, TAGS } from "services/models/models";
import FormField from "../formField/formField";
import { useTranslation } from "react-i18next";

type Props = {
  handleSubmit: (e: React.FormEvent) => void;
  onChangeHandler: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  uploadData: {
    title: string;
    url: string;
    description: string;
    creatorName: string;
    tags: string;
    category: string;
  };
  actionData: {
    errors?: Record<string, string>;
    success?: boolean;
  } | null;
  buttonState: string;
};

const UploadTutorial = (props: Props) => {
  const { t } = useTranslation();
  const {
    handleSubmit,
    onChangeHandler,
    uploadData,
    actionData,
    buttonState,
  } = props;

  return (
    <>
      <div className="mx-auto w-full max-w-md p-5 h-94 mt-5 mb-4 bg-gray-100 mb-20 rounded py-94">
        <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
          {t("admin.tutorials.title")}
        </h2>
        <Form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            htmlFor={"title"}
            label={t("admin.common.title")}
            value={uploadData.title}
            error={actionData?.errors?.title || ""}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"input"}
            onChange={onChangeHandler}
            required
            placeholder={t("admin.common.titlePlaceholder")}
            name={"title"}
          />
          <FormField
            htmlFor={"url"}
            label={t("admin.tutorials.url")}
            value={uploadData.url}
            error={actionData?.errors?.url || ""}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"input"}
            onChange={onChangeHandler}
            required
            placeholder={t("admin.tutorials.urlPlaceholder")}
            name={"url"}
          />
          <FormField
            htmlFor={"creatorName"}
            label={t("admin.tutorials.creator")}
            value={uploadData.creatorName}
            error={actionData?.errors?.creatorName || ""}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"input"}
            onChange={onChangeHandler}
            required
            placeholder={"Gregory Kirtsias"}
            name={"creatorName"}
          />
          <FormField
            htmlFor={"description"}
            label={t("admin.tutorials.description")}
            value={uploadData.description}
            error={actionData?.errors?.description || ""}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"input"}
            onChange={onChangeHandler}
            required
            placeholder={t("admin.tutorials.descriptionPlaceholder")}
            name={"description"}
          />
          <FormField
            htmlFor={"tags"}
            label={t("admin.common.tags")}
            value={uploadData.tags}
            error={actionData?.errors?.tags || ""}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"select"}
            listCategories={Object.values(TAGS.byId)}
            onChange={onChangeHandler}
            required
            placeholder={t("admin.common.selectTags")}
          />
          <FormField
            htmlFor={"category"}
            label={t("admin.common.category")}
            value={uploadData.category}
            error={actionData?.errors?.category || ""}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"select"}
            listCategories={Object.values(Category.byId)}
            onChange={onChangeHandler}
            required
            placeholder={t("admin.common.selectCategory")}
          />
          <button
            value="uploadTutorial"
            name="_uploadTutorial"
            type="submit"
            className="w-full mb-4 rounded bg-orange-500 py-2 px-4 text-white hover:bg-orange-600 focus:bg-orange-400"
          >
            {buttonState}
          </button>
        </Form>
        {actionData?.errors && (
          <Alerts.ErrorAlert error={actionData.errors.general || Object.values(actionData.errors)[0]} />
        )}
        {actionData?.success && (
          <Alerts.SuccessAlert message={t("admin.tutorials.success")} />
        )}
      </div>
    </>
  );
};

export default UploadTutorial;
