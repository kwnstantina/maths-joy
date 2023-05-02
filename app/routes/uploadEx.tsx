import React, { useCallback, useEffect, useState } from "react";
import {
  useActionData,
  useSubmit,
  useNavigate,
  useTransition,
} from "@remix-run/react";
import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
} from "@remix-run/node";
import { createExersice } from "~/utils/exersices.prisma";
import InternalFunctions from "services/internal/internalFuntions";
import { validateFile } from "~/utils/validators.server";
import { getUser } from "~/utils/auth.prisma";
import { Tab } from "@headlessui/react";
import UploadFile from "components/uploadExTabs/uploadFile";
import UploadExercise from "components/uploadExTabs/uploadExercise";
import { createTrainingExercise } from "~/utils/training.prisma";

export const loader: LoaderFunction = async ({ request }) => {
  let user = await getUser(request);
  return user && user["role"] === "ADMIN" ? json(user) : redirect("/progress");
};
export function ErrorBoundary({ error }: any) {
  const navigate = useNavigate();
  return (
    <div
      className="w-3/4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative h-screen mb-40"
      role="alert"
    >
      <strong className="font-bold">Σφάλμα,</strong>
      <span className="block sm:inline">
        Παρουσιάστηκε κάποιο πρόβλημα. Παρακαλώ ξαναπροσπαθήστε ξανά.
      </span>
      <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
        <svg
          className="fill-current h-6 w-6 text-red-500"
          onClick={() => navigate(-1)}
          role="button"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <title>x</title>
          <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
        </svg>
      </span>
    </div>
  );
}

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const _action = form.get("_action");
  const title = form.get("title") as string;
  const category = form.get("category") as string;
  const file = form.get("file") as File | any;
  const tags = form.get("tags") as string;
  const exercise = form.get("exercise") as string;
  const solution = form.get("solution") as string;
  const fileContentType = form.get("fileContentType") as string;
  const searchableTitle = form.get("searchableTitle") as string;
  const description = form.get("description") as string;
  const exerciseImgUrl = form.get("exerciseImgUrl") as string;

  if (_action === "uploadExercise") {
    const errors = {
      file: validateFile(file["_name"]),
    };

    if (errors.file || !title || !category) {
      return json(
        {
          errors,
          fields: { file, title, category },
          form: action,
        },
        { status: 400 }
      );
    }
    return await createExersice({
      title,
      category,
      file,
      fileContentType,
      tags,
      description,
      exerciseImgUrl,
    });
  }
  if (_action === "uploadTraning") {
    return await createTrainingExercise({
      title,
      category,
      exercise,
      solution,
      tags,
      searchableTitle,
    });
  }
};

export default function UploadExcercise(): JSX.Element {
  const actionData = useActionData();
  const transition = useTransition();
  const submit = useSubmit();
  const [action, setAction] = useState("uploadExercise") as any;
  const [uploadData, setUploadData] = useState({
    title: "",
    file: "",
    tags: "",
    category: "",
    exercise: "",
    solution: "",
    searchableTitle: "",
    description:"",
    exerciseImgUrl:""
  } as any);

  const [categories] = useState([
    "Ανέβασμα Αρχείου",
    "Ανέβασμα Ασκησης",
    "Προφίλ",
  ]);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    setUploadData({
      title: "",
      file: "",
      tags: "",
      category: "",
      exercise: "",
      solution: "",
      searchableTitle: "",
      description:"",
      exerciseImgUrl:""
    });

    setAction(() => {
      if (tabIndex === 0) {
        return "uploadExercise";
      } else if (tabIndex === 1) {
        return "uploadTraning";
      }
    });
  }, [tabIndex]);

  const onChangeHandler = useCallback(
    (evt: any) => {
      if (evt && evt.target && evt.target.value) {
        return setUploadData((form: any) => ({
          ...form,
          [evt?.target.name]: evt?.target.value,
        }));
      } else {
        return setUploadData((form: any) => ({
          ...form,
          [evt?.title]: evt?.name,
        }));
      }
    },
    [uploadData]
  );

  const classNames = (...classes: any) => {
    return classes.filter(Boolean).join(" ");
  };
  const buttonState =
    transition.state === "submitting"
      ? "Saving..."
      : transition.state === "loading"
      ? "Saved!"
      : "Δημημιουργία Ασκησης";

  const fileUploadHandler = async (
    event: React.ChangeEvent<HTMLInputElement> | any
  ) => {
    const file: any = event?.target?.files;
    const data = await InternalFunctions.getBase64(file[0])
      .then((result: any) => {
        return result;
      })
      .catch((err: any) => {
        console.log("error on upload File", err);
      });

    setUploadData((form: any) => ({
      ...form,
      [event.target?.name]: data,
    }));
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement | any> | any
  ) => {
    let $form = event.currentTarget;
    let formData = new FormData(event.target);
    formData.set("tags", uploadData.tags);
    formData.set("category", uploadData.category);
    formData.set("title", uploadData.title);
    formData.set("_action", action);
    if (action === "uploadExercise") {
      formData.set(
        "fileContentType",
        uploadData.file["fileContentType"] as any
      );
    }
    if (action === "uploadTraning") {
      formData.set("exercise", uploadData.exercise["fileContentType"]);
      formData.set("solution", uploadData.solution["fileContentType"]);
      formData.set("searchableTitle", uploadData.searchableTitle);
      formData.set("description", uploadData.description);
      formData.set("exerciseImgUrl", uploadData.exerciseImgUrl);
    }
    submit(formData, {
      method: "post",
      action: $form.getAttribute("action") ?? $form.action,
      encType: "multipart/form-data",
    });
  };

  return (
    <div className="lg:w-8/12 sm:w-10/12 px-2 py-16 mx-6">
      <Tab.Group
        onChange={(index) => {
          setTabIndex(index);
        }}
      >
        <Tab.List className="flex space-x-1 rounded-xl bg-orange-600 p-1">
          {categories.map((category) => (
            <Tab
              key={category}
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-orange-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-orange-400 focus:outline-none focus:ring-2",
                  selected
                    ? "bg-white shadow"
                    : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                )
              }
            >
              {category}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          {tabIndex === 0 && (
            <UploadFile
              handleSubmit={handleSubmit}
              onChangeHandler={onChangeHandler}
              uploadData={uploadData}
              actionData={actionData}
              fileUploadHandler={fileUploadHandler}
              buttonState={buttonState}
            />
          )}
          {tabIndex === 1 && (
            <UploadExercise
              handleSubmit={handleSubmit}
              onChangeHandler={onChangeHandler}
              uploadData={uploadData}
              actionData={actionData}
              buttonState={buttonState}
              fileUploadHandler={fileUploadHandler}
            />
          )}
          {tabIndex === 2 && (
            <div className="h-screen mx-auto w-full max-w-md"></div>
          )}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
