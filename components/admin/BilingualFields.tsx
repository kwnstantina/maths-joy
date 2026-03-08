import { useTranslation } from "react-i18next";

interface BilingualFieldsProps {
  fieldName: string;
  labelKeyEl: string;
  labelKeyEn: string;
  defaultValueEl?: string;
  defaultValueEn?: string;
  required?: boolean;
  textarea?: boolean;
  errors?: Record<string, string>;
}

export default function BilingualFields({
  fieldName,
  labelKeyEl,
  labelKeyEn,
  defaultValueEl,
  defaultValueEn,
  required,
  textarea,
  errors,
}: BilingualFieldsProps) {
  const { t } = useTranslation();
  const inputClass =
    "mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5";

  return (
    <div className="space-y-4">
      {/* Greek */}
      <div>
        <label
          htmlFor={`${fieldName}_el`}
          className="block text-sm font-medium text-gray-700"
        >
          {t(labelKeyEl)} {required && "*"}
        </label>
        {textarea ? (
          <textarea
            id={`${fieldName}_el`}
            name={`${fieldName}_el`}
            defaultValue={defaultValueEl}
            required={required}
            rows={3}
            className={inputClass}
          />
        ) : (
          <input
            type="text"
            id={`${fieldName}_el`}
            name={`${fieldName}_el`}
            defaultValue={defaultValueEl}
            required={required}
            className={inputClass}
          />
        )}
        {errors?.[fieldName] && (
          <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>
        )}
      </div>

      {/* English */}
      <div>
        <label
          htmlFor={`${fieldName}_en`}
          className="block text-sm font-medium text-gray-700"
        >
          {t(labelKeyEn)}
        </label>
        {textarea ? (
          <textarea
            id={`${fieldName}_en`}
            name={`${fieldName}_en`}
            defaultValue={defaultValueEn}
            rows={3}
            className={inputClass}
          />
        ) : (
          <input
            type="text"
            id={`${fieldName}_en`}
            name={`${fieldName}_en`}
            defaultValue={defaultValueEn}
            className={inputClass}
          />
        )}
      </div>
    </div>
  );
}
