import { useState } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { uploadFile } from "@/services/api";

interface UploadedFileInfo {
  id: string;
  name: string;
}

interface FileUploadProps {
  onFileUploaded: (fileId: string, fileName: string) => void;
  uploadedFiles: UploadedFileInfo[];
  onRemoveFile: (fileId: string) => void;
  disabled?: boolean;
}

const FileUpload = ({ 
  onFileUploaded, 
  uploadedFiles,
  onRemoveFile,
  disabled 
}: FileUploadProps) => {
  const { lang } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError(lang === "ar" ? "الملف كبير جداً (الحد الأقصى 10 ميجابايت)" : "File too large (max 10MB)");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await uploadFile(file);
      if (!response.id) {
        throw new Error(lang === "ar" ? "فشل رفع الملف: لم يتم إرجاع معرّف الملف" : "Upload failed: No file ID returned");
      }
      // Convert integer ID to string for consistency with fileIds array
      onFileUploaded(String(response.id), response.name || file.name);
      setError(null); // Clear error on success
      e.target.value = ""; // Clear input for re-upload
    } catch (err: any) {
      setError(err.message || (lang === "ar" ? "فشل رفع الملف" : "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <label
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg 
            border border-border hover:bg-accent cursor-pointer transition-colors
            ${disabled || uploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>{lang === "ar" ? "إرفاق ملف" : "Attach Document"}</span>
          <input
            type="file"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </label>

        {uploading && (
          <span className="text-xs text-muted-foreground">
            {lang === "ar" ? "جاري الرفع..." : "Uploading..."}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive">
          {error}
        </p>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-lg text-sm border border-border"
            >
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-foreground truncate max-w-[150px]" title={file.name}>
                {file.name}
              </span>
              <button
                onClick={() => onRemoveFile(file.id)}
                disabled={disabled}
                className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                aria-label={lang === "ar" ? "إزالة الملف" : "Remove file"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
