import List from "components/lists/lists";
import { useEffect, useState } from "react";

interface FormFieldProps {
  htmlFor: string;
  label: string;
  type?: string;
  value?: any;
  onChange?: (...args: any) => any;
  error: string;
  labelStyle: string;
  typeOfField?: string;
  listCategories?: Array<any> | any;
  required: boolean;
  accept?: string;
  name?: string;
  id?: string;
  placeholder?: string;
}

const FormField = ({
  htmlFor,
  label,
  type,
  value,
  onChange = () => {},
  error = "",
  labelStyle,
  typeOfField = "input",
  listCategories,
  required = false,
  accept,
  name,
  id,
  placeholder,
}: FormFieldProps) => {
  return (
    <>
      <label htmlFor={htmlFor} className={labelStyle}>
        {label}
      </label>
      {typeOfField === "input" ? (
        <input
          onChange={onChange}
          type={type}
          id={id}
          name={name}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          required={required}
          accept={accept}
        />
      ) : typeOfField === "select" ? (
        <List
          categories={listCategories}
          onCallbackFunction={onChange}
          name={htmlFor}
          required={required}
          placeholder={placeholder}
          value={value}
        />
      ) : null}
      <div className="pt-1 text-red-700">{error}</div>
    </>
  );
};

export default FormField;
