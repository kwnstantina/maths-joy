import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface FileUploadFieldProps {
  name: string;
  label: string;
  accept: string;
  required?: boolean;
  error?: string;
  previewType?: "pdf" | "image";
  helpText?: string;
}

export default function FileUploadField({
  name,
  label,
  accept,
  required,
  error,
  previewType,
  helpText,
}: FileUploadFieldProps) {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && "*"}
      </label>
      <input
        type="file"
        name={name}
        accept={accept}
        onChange={handleChange}
        required={required}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
      />
      {helpText && <p className="text-xs text-gray-400 mt-1">{helpText}</p>}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {previewUrl && previewType === "pdf" && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-1">{t("admin.common.preview")}</p>
          <object
            data={previewUrl}
            type="application/pdf"
            width="100%"
            height="300px"
            className="border rounded"
          >
            <p className="text-sm text-gray-400 p-4">
              PDF preview not supported in this browser.
            </p>
          </object>
        </div>
      )}
      {previewUrl && previewType === "image" && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-1">{t("admin.common.preview")}</p>
          <img
            src={previewUrl}
            alt="Preview"
            loading="lazy"
            className="max-h-48 object-contain rounded border"
          />
        </div>
      )}
    </div>
  );
}
