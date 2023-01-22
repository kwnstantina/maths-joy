import React, { useCallback, useState } from "react";
import { Form, useActionData,useSubmit,useNavigate} from "@remix-run/react";
import { ActionFunction, json,LoaderFunction ,redirect} from '@remix-run/node';
import { createExersice } from "~/utils/exersices.prisma";
import Alerts from "components/alerts/alerts";
import InternalFunctions from "services/internal/internalFuntions";
import List from "components/lists/lists";
import {TAGS,Category,Type} from '../../services/models/models';
import {validateFile} from "~/utils/validators.server";
import {getUser} from '~/utils/auth.prisma';

export const loader: LoaderFunction = async ({ request }) => {
  // If there's already a user in the session, redirect to the home page
  let user = await getUser(request)
  return user && user['role']==='ADMIN' ?json(user): redirect('/progress');
};
export function ErrorBoundary({ error }:any) {
  const navigate = useNavigate();
  
  return (
    <div className="w-3/4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative h-screen mb-40" role="alert">
    <strong className="font-bold">Σφάλμα,</strong>
    <span className="block sm:inline">είτε το αρχείο ήταν πολύ μεγάλο, είτε υπάρχει πρόβλημα σύνδεσης. Παρακαλώ ξαναπροσπαθήστε.</span>
    <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
      <svg className="fill-current h-6 w-6 text-red-500" onClick={()=>navigate(-1)} role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>x</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
    </span>
  </div>
  );
}

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const title = form.get('title') as string;
  const category = form.get('category') as string;
  const file=form.get('file') as File | any;
  const tags=form.get('tags') as string;
  const fileContentType=form.get('fileContentType') as string;
  const errors = {
      file:validateFile(file['_name']),  
  };
    if (Object.values(errors).some(Boolean))
      return json(
        {
          errors,
          fields: { file, },
          form: action,
        },
        { status: 400 }
      );
  return await createExersice({ title, category,file,fileContentType,tags});
 
};

export default function UploadExcercise(): JSX.Element {
  const actionData = useActionData();
  const submit = useSubmit();
  const transition =useNavigate()  as any;
  const [uploadData, setUploadData] = useState({
    title: '',
    file: '',
    tags:'',
    category:''
  } as any);
  
  const onChangeHandler = useCallback((evt:any) => {
    setUploadData((form: any) => ({
      ...form,
      [evt?.title]: evt?.name,
    }));
  },[]);

  const fileUploadHandler=async (event: React.ChangeEvent<HTMLInputElement>)=>{
   const file:any= event?.target?.files;
   const data =await InternalFunctions.getBase64(file[0])
      .then((result: any) => {
        return result
        })
      .catch((err: any) => {
        console.log('error on upload File',err);
      });
    setUploadData((form: any) => ({
      ...form,
      [event.target?.name]: data,
    }));
  }

  const handleSubmit=(event: React.FormEvent<HTMLFormElement>)=> {
    event.preventDefault();
    let $form = event.currentTarget;
    let formData = new FormData($form);
    formData.set("tags",uploadData.tags);
    formData.set("category",uploadData.category);
    formData.set("title",uploadData.title);
    formData.set("fileContentType", uploadData.file['fileContentType'] as any);
    submit(formData, {
      method:'post',
      action: $form.getAttribute("action") ?? $form.action,
      encType:'multipart/form-data'
    });
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-md p-5 h-94 mt-5 mb-4 bg-gray-100 mb-20 rounded py-94">
        <Form  onSubmit={handleSubmit} className="space-y-6">
          <div>   
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Τάξεις
            </label>
            <div className="mt-1 mb-2">
              <List            
                categories={TAGS}
                onCallbackFunction={onChangeHandler}
                name='title'
              />
              {actionData?.errors?.title && (
                <div className="pt-1 text-red-700" id="password-error">
                  {actionData.errors.title}
                </div>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="category"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Επιλογή Κατηγορίας
            </label>
            <List            
                categories={Category}
                onCallbackFunction={onChangeHandler}
                name='category'
              />
          </div>
          <div>
            <label
              htmlFor="tags"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
             Τύπος άσκησης
            </label>
            <List            
                categories={Type}
                onCallbackFunction={onChangeHandler}
                name='tags'
              />
          </div>
          <div>
            <label
              htmlFor="file_input"
              className="block text-sm font-medium text-gray-700"
            >
              Επιλογή αρχείου
            </label>
            <div className="mt-1">
              <input
                className="block w-72 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                id="file_input"
                type="file"
                name="file"
                required
                accept=".pdf"
                onChange={(event) => fileUploadHandler(event)}
              />
              {actionData?.errors?.file && (
                <div className="pt-1 text-red-700" id="password-error">
                  {actionData.errors.file}
                </div>
              )}
            </div>
          </div>
          <button
            value="upload"
            name="_uploadExercise"
            type="submit"
            className="w-full mb-4 rounded bg-orange-500  py-2 px-4 text-white hover:bg-orange-600 focus:bg-orange-400"
          >
            Δημιούργια Ασκησης
          </button>
      
        </Form>
        {actionData?.error && <Alerts.ErrorAlert error={actionData.error} />}
      </div>
    </div>
  );
}
