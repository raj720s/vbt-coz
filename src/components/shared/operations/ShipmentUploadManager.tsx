/*"use client";

import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import Button from "@/components/ui/button/Button";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/icons";
import { processExcelFile } from "@/utils/clientShipmentService";
import { useMessage } from "@/components/ui/MessageBox";

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

function ShipmentUploadManager() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { showSuccess, showError } = useMessage();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newProgress: UploadProgress[] = acceptedFiles.map((file) => ({
      fileName: file.name,
      progress: 0,
      status: "uploading",
    }));

    setUploadProgress(newProgress);
    setIsUploading(true);

    // Process each file
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      
      try {
        // Check for duplicate file names
        // const isDuplicate = uploadHistory.some(history => history.fileName === file.name); // This line was removed as per the edit hint
        // if (isDuplicate) { // This line was removed as per the edit hint
        //   throw new Error(`File "${file.name}" already exists. Please rename the file and try again.`); // This line was removed as per the edit hint
        // } // This line was removed as per the edit hint

        // Process file client-side
        const result = await processExcelFile(file, (progress) => {
          setUploadProgress((prev) =>
            prev.map((item, index) =>
              index === i
                ? { ...item, progress: progress.progress, status: progress.status === "completed" ? "completed" : "uploading" }
                : item
            )
          );
        });

        // Store validation result in session storage with file information
        const validationData = {
          ...result,
          fileName: file.name,
          uploadDate: new Date().toISOString(),
          fileSize: file.size,
          fileId: result.fileId
        };
        console.log('Upload: Storing validation data:', validationData);
        sessionStorage.setItem('validationResult', JSON.stringify(validationData));
        sessionStorage.setItem('validShipments', JSON.stringify(result.validData));

        // Refresh upload history from localStorage
        // const files = getUploadedFiles(); // This line was removed as per the edit hint
        // const historyItems = files.map((file: any) => ({ // This line was removed as per the edit hint
        //   id: file.id, // This line was removed as per the edit hint
        //   fileName: file.originalName, // This line was removed as per the edit hint
        //   uploadDate: file.uploadDate, // This line was removed as per the edit hint
        //   fileSize: file.fileSize, // This line was removed as per the edit hint
        //   status: "completed" as const, // This line was removed as per the edit hint
        //   totalRecords: file.totalRows || 0, // This line was removed as per the edit hint
        //   validRecords: file.validRows || 0, // This line was removed as per the edit hint
        //   invalidRecords: file.invalidRows || 0, // This line was removed as per the edit hint
        // })); // This line was removed as per the edit hint
        // setUploadHistory(historyItems); // This line was removed as per the edit hint

        // Enhanced validation feedback
        const hasErrors = result.errors && result.errors.length > 0;
        const hasWarnings = result.warnings && result.warnings.length > 0;
        const validRecords = result.validData ? result.validData.length : 0;
        const totalErrors = result.errors ? result.errors.length : 0;

        if (hasErrors) {
          // Validation failed
          showError(
            "Validation Failed",
            `${file.name}: ${totalErrors} error(s) found. Please fix the errors and try again.`
          );
          
          // Update progress to error state
          setUploadProgress((prev) =>
            prev.map((item, index) =>
              index === i
                ? { ...item, status: "error", error: `${totalErrors} validation errors found` }
                : item
            )
          );
        } else {
          // Validation successful
          let successMessage = `✅ ${file.name} uploaded successfully!\n📊 ${result.validData.length} valid records processed`;
          
          if (result.errors.length > 0) {
            successMessage += `\n⚠️ ${result.errors.length} validation errors found`;
          }
          
          successMessage += '\n🚀 Proceeding to Container Planning...';
          
          showSuccess(
            "Upload Successful",
            successMessage
          );
          
          // Auto-redirect to container planning for successful validation
          setTimeout(() => {
            router.push("/admin/container-planning");
          }, 2000);
        }
        
      } catch (error) {
        console.error('Upload error:', error);
        
        // Update progress to error
        setUploadProgress((prev) =>
          prev.map((item, index) =>
            index === i
              ? { 
                  ...item, 
                  progress: 100, 
                  status: "error",
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              : item
          )
        );

        showError(
          "Upload Failed",
          `${file.name} upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    setIsUploading(false);
  }, []); // Removed uploadHistory from dependency array as per the edit hint

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: true,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = () => {
    // Navigate to container planning with the uploaded file data
    router.push("/admin/container-planning");
  };

  const getStatusColor = (status: UploadProgress["status"]) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
      case "error": return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
      default: return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:text-yellow-900/20";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shipment Upload</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-400">
        Upload Excel files containing shipment data for container load planning. Only Excel files (.xlsx, .xls) are supported.
      </p>

      
      <div className="mb-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-3">
            <div className="text-4xl">📁</div>
            <div>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {isDragActive ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                or click to select files
              </p>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Supports Excel (.xlsx, .xls) files up to 10MB
            </p>
          </div>
        </div>
      </div>

      
      {uploadProgress.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Upload Progress
          </h3>
          <div className="space-y-3">
            {uploadProgress.map((progress, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {progress.fileName}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    progress.status === "completed" ? "text-green-600 bg-green-100" :
                    progress.status === "error" ? "text-red-600 bg-red-100" :
                    "text-yellow-600 bg-yellow-100"
                  }`}>
                    {progress.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress.status === "completed" ? "bg-green-500" :
                      progress.status === "error" ? "bg-red-500" :
                      "bg-yellow-500"
                    }`}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                {progress.error && (
                  <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      
      <div className="flex flex-wrap gap-4 mb-8">
        <Button 
          onClick={handleUpload}
          disabled={!uploadProgress.some(p => p.status === "completed")}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Start Planning
        </Button>
      </div>

      
    </div>
  );
}

export default withSimplifiedRBAC(ShipmentUploadManager, {
  route: "/admin/shipment-upload"
}); 

*/