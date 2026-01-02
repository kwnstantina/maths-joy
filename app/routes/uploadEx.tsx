import React, { useCallback, useEffect, useState } from "react";
import {
  useActionData,
  useSubmit,
  useNavigate,
  useNavigation,
  useRouteError,
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

// Type definitions
interface UploadFormData {
  title: string;
  file: string | { fileContentType: string };
  tags: string;
  category: string;
  exercise: string | { fileContentType: string };
  solution: string | { fileContentType: string };
  searchableTitle: string;
  description: string;
  exerciseImgUrl: string;
}

interface FilterEvent {
  title: string;
  name: string;
}

type ActionType = "uploadExercise" | "uploadTraning";

export const loader: LoaderFunction = async ({ request }) => {
  let user = await getUser(request);
  return user && user["role"] === "ADMIN" ? json(user) : redirect("/progress");
};
export function ErrorBoundary() {
  const error = useRouteError();
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

export default function UploadExcercise(): React.ReactElement {
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [action, setAction] = useState<ActionType>("uploadExercise");
  const [uploadData, setUploadData] = useState<UploadFormData>({
    title: "",
    file: "",
    tags: "",
    category: "",
    exercise: "",
    solution: "",
    searchableTitle: "",
    description: "",
    exerciseImgUrl: ""
  });

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

    setAction(tabIndex === 0 ? "uploadExercise" : "uploadTraning");
  }, [tabIndex]);

  const onChangeHandler = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement> | FilterEvent) => {
      if ('target' in evt && evt.target && evt.target.value) {
        return setUploadData((form: UploadFormData) => ({
          ...form,
          [evt.target.name]: evt.target.value,
        }));
      } else if ('title' in evt) {
        return setUploadData((form: UploadFormData) => ({
          ...form,
          [evt.title]: evt.name,
        }));
      }
    },
    []
  );

  const classNames = (...classes: (string | boolean | undefined)[]) => {
    return classes.filter(Boolean).join(" ");
  };
  const buttonState =
    navigation.state === "submitting"
      ? "Saving..."
      : navigation.state === "loading"
      ? "Saved!"
      : "Δημημιουργία Ασκησης";

  const fileUploadHandler = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event?.target?.files;
    if (!files || files.length === 0) return;

    try {
      const data = await InternalFunctions.getBase64(files[0]);
      setUploadData((form: UploadFormData) => ({
        ...form,
        [event.target.name]: data,
      }));
    } catch (err) {
      console.error("Error on upload file:", err);
    }
  };

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    let $form = event.currentTarget;
    let formData = new FormData($form);
    formData.set("tags", uploadData.tags);
    formData.set("category", uploadData.category);
    formData.set("title", uploadData.title);
    formData.set("_action", action);
    if (action === "uploadExercise") {
      const fileContent = typeof uploadData.file === 'object' ? uploadData.file.fileContentType : '';
      formData.set("fileContentType", fileContent);
    }
    if (action === "uploadTraning") {
      const exerciseContent = typeof uploadData.exercise === 'object' ? uploadData.exercise.fileContentType : '';
      const solutionContent = typeof uploadData.solution === 'object' ? uploadData.solution.fileContentType : '';
      formData.set("exercise", exerciseContent);
      formData.set("solution", solutionContent);
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
        onChange={(index: number) => {
          setTabIndex(index);
        }}
      >
        <Tab.List className="flex space-x-1 rounded-xl bg-orange-600 p-1">
          {categories.map((category: string) => (
            <Tab
              key={category}
              className={({ selected }: { selected: boolean }) =>
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
