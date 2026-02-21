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
    description: string;
    price: string;
    currency: string;
    tags: string;
    category: string;
    pdfFile: string;
    thumbnailFile: string;
    isActive: boolean;
  };
  actionData: {
    errors?: Record<string, string>;
    success?: boolean;
  } | null;
  buttonState: string;
  fileUploadHandler: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const UploadBook = (props: Props) => {
  const { t } = useTranslation();
  const {
    handleSubmit,
    onChangeHandler,
    uploadData,
    actionData,
    buttonState,
    fileUploadHandler,
  } = props;

  const currencies = [
    { id: "EUR", name: "EUR" },
    { id: "USD", name: "USD" },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-md p-5 h-94 mt-5 mb-4 bg-gray-100 mb-20 rounded py-94">
        <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
          {t("admin.books.upload")}
        </h2>
        <Form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            htmlFor={"title"}
            label={t("admin.common.title")}
            value={uploadData.title}
            error={actionData?.errors?.title}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"input"}
            onChange={onChangeHandler}
            required
            placeholder={t("admin.common.titlePlaceholder")}
            name={"title"}
          />
          <FormField
            htmlFor={"description"}
            label={t("admin.tutorials.description")}
            value={uploadData.description}
            error={actionData?.errors?.description}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"input"}
            onChange={onChangeHandler}
            required
            placeholder={t("admin.tutorials.descriptionPlaceholder")}
            name={"description"}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              htmlFor={"price"}
              label={t("admin.books.price")}
              value={uploadData.price}
              error={actionData?.errors?.price}
              labelStyle={"block text-sm font-medium text-gray-700"}
              typeOfField={"input"}
              onChange={onChangeHandler}
              required
              placeholder={"9.99"}
              name={"price"}
              type="number"
            />
            <FormField
              htmlFor={"currency"}
              label={t("admin.books.currency")}
              value={uploadData.currency}
              error={actionData?.errors?.currency}
              labelStyle={"block text-sm font-medium text-gray-700"}
              typeOfField={"select"}
              listCategories={currencies}
              onChange={onChangeHandler}
              required
              placeholder={"EUR"}
            />
          </div>
          <FormField
            htmlFor={"category"}
            label={t("admin.common.category")}
            value={uploadData.category}
            error={actionData?.errors?.category}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"select"}
            listCategories={Object.values(Category.byId)}
            onChange={onChangeHandler}
            required
            placeholder={t("admin.common.selectCategory")}
          />
          <FormField
            htmlFor={"tags"}
            label={t("admin.common.tags")}
            value={uploadData.tags}
            error={actionData?.errors?.tags}
            labelStyle={"block text-sm font-medium text-gray-700"}
            typeOfField={"select"}
            listCategories={Object.values(TAGS.byId)}
            onChange={onChangeHandler}
            required
            placeholder={t("admin.common.selectTags")}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("admin.books.pdfFile")}
            </label>
            <input
              type="file"
              name="pdfFile"
              accept=".pdf"
              onChange={fileUploadHandler}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              required
            />
            {actionData?.errors?.pdfFile && (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.pdfFile}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("admin.books.thumbnail")}
            </label>
            <input
              type="file"
              name="thumbnailFile"
              accept="image/*"
              onChange={fileUploadHandler}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
            {actionData?.errors?.thumbnailFile && (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.thumbnailFile}</p>
            )}
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={uploadData.isActive}
              onChange={onChangeHandler}
              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              {t("admin.books.isActive")}
            </label>
          </div>
          <button
            value="uploadBook"
            name="_uploadBook"
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
          <Alerts.SuccessAlert message={t("admin.books.success")} />
        )}
      </div>
    </>
  );
};

export default UploadBook;
