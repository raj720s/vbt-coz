"use client";

import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import Button from "@/components/ui/button/Button";
import { useState, useEffect } from "react";
// Removed useLocalStorageData - localStorage managed by services
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { planContainers, savePlanningResults } from "@/utils/containerPlanningService";
import { downloadResultsExcel } from "@/utils/exportResultsService";
import { ContainerPlanningResult } from "@/utils/localStorageService";
import { 
  uploadFileForOptimization, 
  convertExcelToCSV, 
  CargoOptimizationUploadProgress,
  OptimizationResult
} from '@/services/cargoOptimizationService';

interface PlanningStage {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "completed" | "error";
  progress: number;
  description: string;
}

function ContainerPlanningPage() {
  // Removed useLocalStorageData - localStorage managed by services
  
  const router = useRouter();
  const [isPlanning, setIsPlanning] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [validationPassed, setValidationPassed] = useState(false);
  const [planningResult, setPlanningResult] = useState<Record<string, unknown> | null>(null);
  const [showExportButton, setShowExportButton] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [apiProgress, setApiProgress] = useState<CargoOptimizationUploadProgress | null>(null);
  const [apiResponseFile, setApiResponseFile] = useState<{ blob: Blob; fileName: string } | null>(null);

  // Check validation status on component mount
  useEffect(() => {
    const checkValidation = () => {
      try {
        const storedData = sessionStorage.getItem('validationResult');
        if (!storedData) {
          toast.error('No validation data found. Please upload and validate a file first.');
          router.push('/admin/shipment-upload');
          return;
        }

        const validationData = JSON.parse(storedData);
        
        // Check if there are any validation errors
        if (validationData.errors && validationData.errors.length > 0) {
          toast.error('Validation has errors. Please fix them before proceeding to container planning.');
          router.push('/admin/validation-summary');
          return;
        }

        // Check if there are valid shipments
        if (!validationData.validData || validationData.validData.length === 0) {
          toast.error('No valid shipments found. Please upload a file with valid data.');
          router.push('/admin/shipment-upload');
          return;
        }

        setValidationPassed(true);
      } catch (error) {
        console.error('Error checking validation:', error);
        toast.error('Error checking validation status.');
        router.push('/admin/shipment-upload');
      }
    };

    checkValidation();
  }, [router]);
  const [stages, setStages] = useState<PlanningStage[]>([
    {
      id: "1",
      name: "File Upload",
      status: "pending",
      progress: 0,
      description: "Uploading shipment data to cargo optimization service",
    },
    {
      id: "2",
      name: "Optimization Processing",
      status: "pending",
      progress: 0,
      description: "AI-powered cargo optimization and container assignment",
    },
    {
      id: "3",
      name: "Results Processing",
      status: "pending",
      progress: 0,
      description: "Processing optimization results and generating assignment data",
    },
  ]);

  const startPlanning = async () => {
    setIsPlanning(true);
    setCurrentStage(0);
    setApiProgress(null);

    try {
      // Get validation data from session storage
      const storedData = sessionStorage.getItem('validationResult');
      if (!storedData) {
        throw new Error('No validation data available');
      }

      const validationData = JSON.parse(storedData);
      
      // Get valid shipments data
      if (!validationData.validData || validationData.validData.length === 0) {
        throw new Error('No valid shipment data found.');
      }

      // Get the original uploaded file from localStorage
      const uploadedFiles = JSON.parse(localStorage.getItem('nxt_admin_uploaded_files') || '[]');
      const currentFile = uploadedFiles.find((f: any) => f.id === validationData.fileId);
      
      if (!currentFile || !currentFile.fileContent) {
        throw new Error('Original file not found. Please re-upload the file.');
      }

      // Convert base64 back to file
      const fileContent = atob(currentFile.fileContent);
      const bytes = new Uint8Array(fileContent.length);
      for (let i = 0; i < fileContent.length; i++) {
        bytes[i] = fileContent.charCodeAt(i);
      }
      
      const originalFile = new File([bytes], currentFile.originalName, {
        type: currentFile.originalName.endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Convert to CSV if it's an Excel file (API might prefer CSV)
      let fileToUpload = originalFile;
      if (originalFile.name.match(/\.(xlsx|xls)$/i)) {
        try {
          fileToUpload = await convertExcelToCSV(originalFile);
        } catch (error) {
          console.warn('Failed to convert to CSV, using original file:', error);
          fileToUpload = originalFile;
        }
      }

      // Stage 1: File Upload
      setCurrentStage(0);
      setStages(prev => prev.map((stage, index) => 
        index === 0 
          ? { ...stage, status: "in-progress", progress: 0 }
          : stage
      ));

      // Upload file to cargo optimization API
      const { results, fileName, responseBlob } = await uploadFileForOptimization(
        fileToUpload,
        (progress: CargoOptimizationUploadProgress) => {
          setApiProgress(progress);
          
          // Update stages based on API progress
          if (progress.stage === 'uploading') {
            setCurrentStage(0);
            setStages(prev => prev.map((stage, index) => 
              index === 0 
                ? { ...stage, status: "in-progress", progress: Math.min(progress.progress, 100) }
                : stage
            ));
          } else if (progress.stage === 'processing') {
            // Complete upload stage and start processing
            setStages(prev => prev.map((stage, index) => 
              index === 0 
                ? { ...stage, status: "completed", progress: 100 }
                : index === 1
                ? { ...stage, status: "in-progress", progress: Math.min(progress.progress - 70, 100) }
                : stage
            ));
            setCurrentStage(1);
          } else if (progress.stage === 'downloading' || progress.stage === 'parsing') {
            // Processing stage
            setStages(prev => prev.map((stage, index) => 
              index === 1 
                ? { ...stage, status: progress.stage === 'parsing' ? "completed" : "in-progress", progress: Math.min(progress.progress - 70, 100) }
                : index === 2 && progress.stage === 'parsing'
                ? { ...stage, status: "in-progress", progress: Math.min(progress.progress - 85, 100) }
                : stage
            ));
            if (progress.stage === 'parsing') {
              setCurrentStage(2);
            }
          } else if (progress.stage === 'completed') {
            // Complete all stages
            setStages(prev => prev.map((stage, index) => 
              index <= 2 
                ? { ...stage, status: "completed", progress: 100 }
                : stage
            ));
          } else if (progress.stage === 'error') {
            // Error state
            setStages(prev => prev.map((stage, index) => 
              index === currentStage 
                ? { ...stage, status: "error", progress: 100 }
                : stage
            ));
          }
        }
      );

      // Store optimization results and API response file
      setOptimizationResults(results);
      setApiResponseFile({
        blob: responseBlob,
        fileName: fileName
      });

      // Store results in session storage for assignment results page
      const resultsForSession = {
        fileName,
        uploadDate: new Date().toISOString(),
        assignments: results.map(result => ({
          shipmentId: result.shipment,
          customer: result.customer,
          containerRef: result.optimizedContainerRef,
          containerType: result.containerType,
          volume: result.cbm,
          totalCBM: result.totalCBM,
          qty: result.qty,
          totalQty: result.totalQty,
          pol: result.pol,
          pod: result.destination,
          status: result.status,
          minThreshold: result.minThreshold,
          maxThreshold: result.maxThreshold
        })),
        summary: {
          totalShipments: results.length,
          assignedShipments: results.filter(r => r.status === 'assigned').length,
          unassignedShipments: results.filter(r => r.status !== 'assigned').length,
          totalContainers: new Set(results.map(r => r.optimizedContainerRef)).size,
          containerTypes: results.reduce((acc, r) => {
            acc[r.containerType] = (acc[r.containerType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      };

      sessionStorage.setItem('planningResults', JSON.stringify(resultsForSession));
      setPlanningResult(resultsForSession);
      setShowExportButton(true);

      const assignedCount = results.filter(r => r.status === 'assigned').length;
      const containerCount = new Set(results.map(r => r.optimizedContainerRef)).size;

      toast.success(
        `🎉 Cargo optimization completed successfully!
        📦 ${containerCount} containers optimized
        ✅ ${assignedCount} shipments assigned
        📊 View detailed results in Assignment Results`
      );

    } catch (error) {
      console.error('Planning error:', error);
      
      // Mark current stage as error
      setStages(prev => prev.map((stage, index) => 
        index === currentStage 
          ? { ...stage, status: "error", progress: 100 }
          : stage
      ));

      toast.error(
        `Cargo optimization failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      );
    } finally {
      setIsPlanning(false);
      setApiProgress(null);
    }
  };

  const getStatusColor = (status: PlanningStage["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600 dark:text-green-400";
      case "in-progress":
        return "text-blue-600 dark:text-blue-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-500 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: PlanningStage["status"]) => {
    switch (status) {
      case "completed":
        return (
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "in-progress":
        return (
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.001 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case "error":
        return (
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  /**
   * Download the API response file (Excel file from cargo optimization)
   */
  const downloadApiResponseFile = () => {
    if (!apiResponseFile) {
      toast.error('No API response file available for download');
      return;
    }

    try {
      // Create a download link
      const url = window.URL.createObjectURL(apiResponseFile.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = apiResponseFile.fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloaded: ${apiResponseFile.fileName}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  // Show loading state while checking validation
  if (!validationPassed) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking validation status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Container Planning
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Run container planning algorithm to optimize assignments
          </p>
        </div>
        <div className="flex gap-3">
          {showExportButton && planningResult && (
            <Button
              onClick={() => {
                try {
                  downloadResultsExcel(planningResult as unknown as ContainerPlanningResult, 'Book-results.xlsx');
                  toast.success('Results exported successfully!');
                } catch (error) {
                  console.error('Export error:', error);
                  toast.error('Failed to export results');
                }
              }}
              size="md"
              className="bg-green-600 hover:bg-green-700"
            >
              📊 Export Results (Book Format)
            </Button>
          )}
          <Button
            onClick={startPlanning}
            disabled={isPlanning}
            size="md"
            className={isPlanning ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isPlanning ? "Planning in Progress..." : "Run Container Planning"}
          </Button>
        </div>
      </div>

      {/* Planning Stages */}
      <div className="space-y-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className={`p-6 bg-white rounded-lg shadow dark:bg-gray-800 border-l-4 ${
              stage.status === "completed"
                ? "border-l-green-500"
                : stage.status === "in-progress"
                ? "border-l-blue-500"
                : stage.status === "error"
                ? "border-l-red-500"
                : "border-l-gray-300 dark:border-l-gray-600"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(stage.status)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stage.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stage.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${getStatusColor(stage.status)}`}>
                  {stage.status === "completed"
                    ? "Completed"
                    : stage.status === "in-progress"
                    ? "In Progress"
                    : stage.status === "error"
                    ? "Error"
                    : "Pending"}
                </span>
                {stage.status === "in-progress" && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stage.progress}%
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  stage.status === "completed"
                    ? "bg-green-500"
                    : stage.status === "in-progress"
                    ? "bg-blue-500"
                    : stage.status === "error"
                    ? "bg-red-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                style={{ width: `${stage.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* API Progress Display */}
      {apiProgress && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              API Progress: {apiProgress.stage.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </h4>
            <span className="text-sm text-blue-600 dark:text-blue-300">
              {apiProgress.progress}%
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${apiProgress.progress}%` }}
            />
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
            {apiProgress.message}
          </p>
          {apiProgress.error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              Error: {apiProgress.error}
            </p>
          )}
        </div>
      )}

      {/* Planning Results Summary */}
      {showExportButton && planningResult && (
        <div className="p-6 bg-green-50 rounded-lg dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-green-900 dark:text-green-100">
              🎉 Planning Completed Successfully!
            </h3>
            <div className="flex gap-2">
              {apiResponseFile && (
                <Button
                  onClick={downloadApiResponseFile}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  📥 Download Assignments
                </Button>
              )}
              <Button
                onClick={() => router.push("/admin/assignment-results")}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                View Detailed Results
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {/*@ts-expect-error - Type assertion needed for dynamic property access on summary object */}
                {(planningResult.summary as unknown as Record<string, unknown>)?.totalShipments || 0}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Total Shipments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {/*@ts-expect-error - Type assertion needed for dynamic property access on summary object */}
                {(planningResult.summary as unknown as Record<string, unknown>)?.assignedShipments || 0}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Assigned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {/*@ts-expect-error - Type assertion needed for dynamic property access on summary object */}
                {(planningResult.summary as unknown as Record<string, unknown>)?.totalContainers || 0}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Containers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {/*@ts-expect-error - Type assertion needed for dynamic property access on summary object */}
                {(planningResult.summary as unknown as Record<string, unknown>)?.unassignedShipments || 0}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Unassigned</p>
            </div>
          </div>
          
          <div className="text-sm text-green-800 dark:text-green-200">
            <p><strong>Next Steps:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Click &quot;📥 Download Assignments&quot; to download the exact API response file</li>
              <li>Click &quot;Export Results (Book Format)&quot; to download the Excel file in Book-results.xlsx format</li>
              <li>Click &quot;View Detailed Results&quot; to see the full planning breakdown</li>
            </ul>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Shipments</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">1,234</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full dark:bg-green-900">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Containers Assigned</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">567</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full dark:bg-yellow-900">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Optimization Score</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">94%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-6 bg-blue-50 rounded-lg dark:bg-blue-900/20">
        <h3 className="mb-3 text-lg font-medium text-blue-900 dark:text-blue-100">
          Planning Process
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>• <strong>Data Bucketing:</strong> Groups shipments by container type and capacity requirements</li>
          <li>• <strong>Container Planning:</strong> Optimizes container assignments based on capacity and priority</li>
          <li>• <strong>Mode Selection:</strong> Determines FCL/LCL mode for each shipment</li>
          <li>• <strong>Repositioning Analysis:</strong> Analyzes container repositioning requirements</li>
        </ul>
      </div>
    </div>
  );
}

export default withSimplifiedRBAC(ContainerPlanningPage, {
  route: "/admin/container-planning",
  privilege: "VIEW_CONTAINER_PLANNING"
}); 