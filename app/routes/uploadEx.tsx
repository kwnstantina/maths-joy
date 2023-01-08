import React, { useCallback, useState } from "react";
import { Form, useActionData,useSubmit } from "@remix-run/react";
import { ActionFunction } from '@remix-run/node';
import { createExersice } from "~/utils/exersices.prisma";
import Alerts from "components/alerts/alerts";
import InternalFunctions from "services/internal/internalFuntions";
import List from "components/lists/lists";
import {TAGS} from '../../services/models/models';

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const title = form.get('title') as string;
  const category = form.get('category') as string;
  const file=form.get('file') as File;
  const tags=form.get('tags') as string;
  const fileContentType=form.get('fileContentType') as string;
  // add validations for pdf
  return await createExersice({ title, category,file,fileContentType,tags});
};

export default function UploadExcercise(): JSX.Element {
  const actionData = useActionData();
  const submit = useSubmit();
  const [uploadData, setUploadData] = useState({
    title: "",
    file: {},
    tags:[]
  } as any);

  const handleTags=useCallback((data: any)=>{
      setUploadData((form: any) => ({
        ...form,
       tags: data,
      }));
    },[])

  const onChangeHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setUploadData((form: any) => ({
      ...form,
      [evt.target?.name]: evt.target?.value,
    }));
  };

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
    formData.set("tags",uploadData.tags.map((item:{name:string})=>item.name).join() as any);
    formData.set("fileContentType", uploadData.file['fileContentType'] as any);
    submit(formData, {
      method:'post',
      action: $form.getAttribute("action") ?? $form.action,
      encType:'multipart/form-data'
    });
  }

  return (
    <div style={{ height: "inherit" }}>
      <div className="mx-auto w-full max-w-md px-8 min-h-full mt-5">
        <Form  onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <div className="mt-1">
              <input
                value={uploadData.title}
                id="title"
                required
                autoFocus={true}
                name="title"
                type="text"
                aria-invalid={actionData?.errors?.title ? true : undefined}
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                onChange={(evt) => onChangeHandler(evt)}
              />
              {actionData?.error?.title && (
                <div className="pt-1 text-red-700" id="email-error">
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
            <select
              required
              onChange={(evt) => onChangeHandler(evt as any)}
              id="category"
              name="category"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value=''>Επιλογή Κατηγορίας</option>
              <option value="ολοκληρώματα">Ολοκληρώματα</option>
              <option value="παράγωγοι">Παράγωγοι</option>
              <option value="μιγαδικοί">Μιγαδικοί</option>
              <option value="γεωμετρία">Γεωμετρία</option>
            </select>
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
                onChange={(event) => fileUploadHandler(event)}
              />
              {actionData?.errors?.file && (
                <div className="pt-1 text-red-700" id="password-error">
                  {actionData.errors.file}
                </div>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700"
            >
              Τάξεις
            </label>
            <div className="mt-1">
              <List            
                categories={TAGS}
                onCallbackFunction={handleTags}
                name='tags'
                isMultiple={true}
              />
              {actionData?.errors?.tags && (
                <div className="pt-1 text-red-700" id="password-error">
                  {actionData.errors.tags}
                </div>
              )}
            </div>
          </div>
          <button
            value="upload"
            name="_uploadExercise"
            type="submit"
            className="w-full rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Δημιούργια Ασκησης
          </button>
        </Form>
        {actionData?.error && <Alerts.ErrorAlert error={actionData.error} />}
      </div>
    </div>
  );
}
