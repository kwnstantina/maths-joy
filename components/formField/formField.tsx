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
  required:boolean;
  accept?:string
  name?:string
  id?:string;
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
  typeOfField='input',
  listCategories,
  required=false,
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
      {typeOfField==='input'  ? <input
        onChange={onChange}
        type={type}
        id={id}
        name={name}
        className="block w-72 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        value={value}
        required={required}
        accept={accept}
      />  
     : typeOfField ==='select' ?  <List            
          categories={listCategories}
          onCallbackFunction={onChange}
          name={htmlFor}
          required={required}
          placeholder={placeholder}
          value={value}
     />:null}
      <div className="pt-1 text-red-700">
        {error}
      </div>
    </>
  );
};

export default FormField;
