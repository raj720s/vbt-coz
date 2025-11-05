"use client";

import { withSimplifiedRBAC } from "@/components/auth/withSimplifiedRBAC";
import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import { DownloadIcon, AlertIcon, CheckCircleIcon, TimeIcon, DatabaseIcon, TrashBinIcon, RefreshIcon, PlayIcon, PauseIcon } from "@/icons";

interface BackupJob {
  id: string;
  name: string;
  type: "full" | "incremental" | "differential";
  status: "running" | "completed" | "failed" | "scheduled" | "paused";
  size: string;
  createdAt: string;
  completedAt?: string;
  duration?: string;
  location: string;
  retention: string;
}

interface BackupSchedule {
  id: string;
  name: string;
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  time: string;
  type: "full" | "incremental";
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
}

function DataBackupPageManager() {
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([
    {
      id: "1",
      name: "Full Backup - 2024-01-15",
      type: "full",
      status: "completed",
      size: "2.4 GB",
      createdAt: "2024-01-15T02:00:00Z",
      completedAt: "2024-01-15T02:45:00Z",
      duration: "45 minutes",
      location: "Local Storage",
      retention: "30 days"
    },
    {
      id: "2",
      name: "Incremental Backup - 2024-01-16",
      type: "incremental",
      status: "completed",
      size: "156 MB",
      createdAt: "2024-01-16T02:00:00Z",
      completedAt: "2024-01-16T02:05:00Z",
      duration: "5 minutes",
      location: "Cloud Storage",
      retention: "7 days"
    },
    {
      id: "3",
      name: "Full Backup - 2024-01-17",
      type: "full",
      status: "running",
      size: "2.1 GB",
      createdAt: "2024-01-17T02:00:00Z",
      location: "Local Storage",
      retention: "30 days"
    },
    {
      id: "4",
      name: "Differential Backup - 2024-01-14",
      type: "differential",
      status: "failed",
      size: "0 MB",
      createdAt: "2024-01-14T02:00:00Z",
      location: "Cloud Storage",
      retention: "14 days"
    },
    {
      id: "5",
      name: "Incremental Backup - 2024-01-18",
      type: "incremental",
      status: "scheduled",
      size: "0 MB",
      createdAt: "2024-01-18T02:00:00Z",
      location: "Local Storage",
      retention: "7 days"
    }
  ]);

  const [schedules, setSchedules] = useState<BackupSchedule[]>([
    {
      id: "1",
      name: "Daily Full Backup",
      frequency: "daily",
      time: "02:00",
      type: "full",
      isActive: true,
      lastRun: "2024-01-17T02:00:00Z",
      nextRun: "2024-01-18T02:00:00Z"
    },
    {
      id: "2",
      name: "Hourly Incremental",
      frequency: "hourly",
      time: "00:00",
      type: "incremental",
      isActive: true,
      lastRun: "2024-01-17T17:00:00Z",
      nextRun: "2024-01-17T18:00:00Z"
    },
    {
      id: "3",
      name: "Weekly Full Backup",
      frequency: "weekly",
      time: "03:00",
      type: "full",
      isActive: false,
      lastRun: "2024-01-14T03:00:00Z",
      nextRun: "2024-01-21T03:00:00Z"
    }
  ]);

  const [selectedJob, setSelectedJob] = useState<BackupJob | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const handleCreateBackup = () => {
    const newJob: BackupJob = {
      id: Date.now().toString(),
      name: `Manual Backup - ${new Date().toLocaleDateString()}`,
      type: "full",
      status: "running",
      size: "0 MB",
      createdAt: new Date().toISOString(),
      location: "Local Storage",
      retention: "30 days"
    };
    setBackupJobs(prev => [newJob, ...prev]);
    toast.success("Backup job created and started");
  };

  const handlePauseBackup = (jobId: string) => {
    setBackupJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: "paused" as const } : job
    ));
    toast.success("Backup paused");
  };

  const handleResumeBackup = (jobId: string) => {
    setBackupJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: "running" as const } : job
    ));
    toast.success("Backup resumed");
  };

  const handleDeleteBackup = (jobId: string) => {
    if (confirm("Are you sure you want to delete this backup?")) {
      setBackupJobs(prev => prev.filter(job => job.id !== jobId));
      toast.success("Backup deleted");
    }
  };

  const handleRestoreBackup = (job: BackupJob) => {
    setSelectedJob(job);
    setShowRestoreModal(true);
  };

  const handleToggleSchedule = (scheduleId: string) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === scheduleId ? { ...schedule, isActive: !schedule.isActive } : schedule
    ));
    toast.success("Schedule status updated");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "running": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "failed": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "scheduled": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "paused": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircleIcon className="w-4 h-4" />;
      case "running": return <PlayIcon className="w-4 h-4" />;
      case "failed": return <AlertIcon className="w-4 h-4" />;
      case "scheduled": return <TimeIcon className="w-4 h-4" />;
      case "paused": return <PauseIcon className="w-4 h-4" />;
      default: return <TimeIcon className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "full": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "incremental": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "differential": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getSummaryStats = () => {
    const total = backupJobs.length;
    const completed = backupJobs.filter(job => job.status === "completed").length;
    const running = backupJobs.filter(job => job.status === "running").length;
    const failed = backupJobs.filter(job => job.status === "failed").length;
    const totalSize = backupJobs
      .filter(job => job.status === "completed")
      .reduce((sum, job) => sum + parseFloat(job.size.split(" ")[0]), 0);

    return { total, completed, running, failed, totalSize };
  };

  const stats = getSummaryStats();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Backup</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage system backups, schedules, and restoration
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Backups</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <DatabaseIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Running</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.running}</p>
            </div>
            <PlayIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
            </div>
            <AlertIcon className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Size</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSize.toFixed(1)} GB</p>
            </div>
            <DatabaseIcon className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Button onClick={handleCreateBackup} size="md">
          <DatabaseIcon className="w-5 h-5 mr-2" />
          Create Backup
        </Button>
        <Button variant="outline" size="md">
          <DownloadIcon className="w-5 h-5 mr-2" />
          Export Backup Log
        </Button>
        <Button variant="outline" size="md">
          <RefreshIcon className="w-5 h-5 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Backup Jobs */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Backup Jobs
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Backup Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {backupJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {job.name}
                      </div>
                      {job.duration && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Duration: {job.duration}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(job.type)}`}>
                        {job.type.charAt(0).toUpperCase() + job.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {job.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {job.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex gap-2">
                        {job.status === "completed" && (
                          <Button
                            onClick={() => handleRestoreBackup(job)}
                            size="sm"
                            variant="outline"
                          >
                            Restore
                          </Button>
                        )}
                        {job.status === "running" && (
                          <Button
                            onClick={() => handlePauseBackup(job.id)}
                            size="sm"
                            variant="outline"
                          >
                            Pause
                          </Button>
                        )}
                        {job.status === "paused" && (
                          <Button
                            onClick={() => handleResumeBackup(job.id)}
                            size="sm"
                            variant="outline"
                          >
                            Resume
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteBackup(job.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Backup Schedules */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Backup Schedules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {schedule.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1)} {schedule.type} backup
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schedule.isActive}
                    onChange={() => handleToggleSchedule(schedule.id)}
                    className="sr-only"
                  />
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    schedule.isActive ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      schedule.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                </label>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Time:</span>
                  <span className="text-gray-900 dark:text-white">{schedule.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(schedule.type)}`}>
                    {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)}
                  </span>
                </div>
                {schedule.lastRun && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Run:</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(schedule.lastRun).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {schedule.nextRun && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Next Run:</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(schedule.nextRun).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Restore Modal */}
      {showRestoreModal && selectedJob && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Restore Backup
            </h3>
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Are you sure you want to restore from this backup?
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedJob.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Size: {selectedJob.size} | Created: {new Date(selectedJob.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowRestoreModal(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={() => {
                setShowRestoreModal(false);
                toast.success("Backup restoration started");
              }}>
                Restore
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withSimplifiedRBAC(DataBackupPageManager, {
  route: "/admin/data-backup"
}); 