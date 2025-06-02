"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useUIStore } from "@/lib/stores/uiStore";
import apiClient from "@/lib/api/client";
import { UploadedFile } from "@/lib/types";

interface FileUploadProps {
  taskId?: string;
  onFilesUploaded?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  showPreviews?: boolean;
  compact?: boolean;
  className?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
  url?: string;
  uploadedFile?: UploadedFile;
}

const FileUploadSystem: React.FC<FileUploadProps> = ({
  taskId,
  onFilesUploaded,
  maxFiles = 5,
  maxFileSize = 10, // 10MB default
  acceptedTypes = [
    "image/*",
    "application/pdf",
    ".doc",
    ".docx",
    ".txt",
    ".zip",
  ],
  showPreviews = true,
  compact = false,
  className = "",
}) => {
  const { addNotification } = useUIStore();
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  console.log("Dark mode:", isDarkMode);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Load existing files for task
  const loadExistingFiles = useCallback(async () => {
    try {
      // This would be an API call to get existing files for the task
      // For now, we'll simulate it
      const response = await apiClient.request<{ files: UploadedFile[] }>({
        url: `/upload/task/${taskId}/files`,
        method: "GET",
      });
      setUploadedFiles(response.files || []);
    } catch (error) {
      console.error("Failed to load existing files:", error);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      loadExistingFiles();
    }
  }, [taskId, loadExistingFiles]);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        return `File size must be less than ${maxFileSize}MB`;
      }

      // Check file type
      const isValidType = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(type.replace("*", ".*"));
      });

      if (!isValidType) {
        return `File type not supported. Accepted types: ${acceptedTypes.join(
          ", "
        )}`;
      }

      return null;
    },
    [maxFileSize, acceptedTypes]
  );

  const generateFileId = () => Math.random().toString(36).substring(2, 15);

  const uploadFile = useCallback(
    async (file: File): Promise<UploadedFile> => {
      if (taskId) {
        const response = await apiClient.uploadTaskAttachments(taskId, [file]);
        return response.data?.files?.[0] || ({} as UploadedFile);
      } else {
        const formData = new FormData();
        formData.append("files", file);
        const response = await apiClient.request<{ files: UploadedFile[] }>({
          url: "/upload/general",
          method: "POST",
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.files?.[0] || ({} as UploadedFile);
      }
    },
    [taskId]
  );

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      const validFiles: File[] = [];
      const errors: string[] = [];

      // Validate each file
      files.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      });

      // Check total file count
      if (
        uploadingFiles.length + uploadedFiles.length + validFiles.length >
        maxFiles
      ) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        validFiles.splice(
          maxFiles - uploadingFiles.length - uploadedFiles.length
        );
      }

      // Show validation errors
      if (errors.length > 0) {
        addNotification({
          id: Math.random().toString(36).substring(2, 15),
          type: "system_announcement",
          title: "Upload Validation Failed",
          message: errors.join(", "),
          read: false,
          createdAt: new Date().toISOString(),
          userId: "system",
        });
      }

      if (validFiles.length === 0) return;

      // Create uploading file entries
      const newUploadingFiles: UploadingFile[] = validFiles.map((file) => ({
        id: generateFileId(),
        file,
        progress: 0,
        status: "uploading",
      }));

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

      // Upload files
      const uploadPromises = newUploadingFiles.map(async (uploadingFile) => {
        try {
          // Simulate progress updates
          const progressInterval = setInterval(() => {
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === uploadingFile.id
                  ? {
                      ...f,
                      progress: Math.min(f.progress + Math.random() * 30, 90),
                    }
                  : f
              )
            );
          }, 500);

          const uploadedFile = await uploadFile(uploadingFile.file);

          clearInterval(progressInterval);

          // Update to completed
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id
                ? { ...f, progress: 100, status: "completed", uploadedFile }
                : f
            )
          );

          // Move to uploaded files after a brief delay
          setTimeout(() => {
            setUploadedFiles((prev) => [...prev, uploadedFile]);
            setUploadingFiles((prev) =>
              prev.filter((f) => f.id !== uploadingFile.id)
            );
          }, 1000);

          return uploadedFile;
        } catch (error) {
          console.error("Upload failed:", error);

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id
                ? { ...f, status: "error", error: "Upload failed" }
                : f
            )
          );

          addNotification({
            id: Math.random().toString(36).substring(2, 15),
            type: "system_announcement",
            title: "Upload Failed",
            message: `Failed to upload ${uploadingFile.file.name}`,
            read: false,
            createdAt: new Date().toISOString(),
            userId: "system",
          });

          return null;
        }
      });

      try {
        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter(Boolean) as UploadedFile[];

        if (successfulUploads.length > 0) {
          addNotification({
            id: Math.random().toString(36).substring(2, 15),
            type: "system_announcement",
            title: "Files Uploaded! 📎",
            message: `Successfully uploaded ${successfulUploads.length} file(s)`,
            read: false,
            createdAt: new Date().toISOString(),
            userId: "system",
          });

          onFilesUploaded?.(successfulUploads);
        }
      } catch (error) {
        console.error("Batch upload error:", error);
      }
    },
    [
      uploadingFiles,
      uploadedFiles,
      maxFiles,
      onFilesUploaded,
      addNotification,
      uploadFile,
      validateFile,
    ]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      dragCounter.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        handleFileUpload(files);
      }
    },
    [handleFileUpload]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      handleFileUpload(files);
      // Reset input value to allow same file re-upload
      e.target.value = "";
    }
  };

  const handleRemoveFile = async (file: UploadedFile) => {
    try {
      // Determine file type based on taskId
      const fileType = taskId ? "attachments" : "general";

      // Use the delete endpoint with type and filename
      await apiClient.request({
        url: `/upload/${fileType}/${file.filename}`,
        method: "DELETE",
      });

      setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id));

      addNotification({
        id: Math.random().toString(36).substring(2, 15),
        type: "system_announcement",
        title: "File Removed! 🗑️",
        message: "File has been successfully deleted",
        read: false,
        createdAt: new Date().toISOString(),
        userId: "system",
      });
    } catch (error) {
      console.error("Failed to remove file:", error);
      addNotification({
        id: Math.random().toString(36).substring(2, 15),
        type: "system_announcement",
        title: "Delete Failed",
        message: "Failed to remove file",
        read: false,
        createdAt: new Date().toISOString(),
        userId: "system",
      });
    }
  };

  const handleRetryUpload = (uploadingFileId: string) => {
    const uploadingFile = uploadingFiles.find((f) => f.id === uploadingFileId);
    if (uploadingFile) {
      // Remove failed upload and retry
      setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadingFileId));
      handleFileUpload([uploadingFile.file]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "🖼️";
      case "zip":
      case "rar":
        return "🗜️";
      case "txt":
        return "📃";
      case "mp4":
      case "mov":
        return "🎥";
      case "mp3":
      case "wav":
        return "🎵";
      default:
        return "📎";
    }
  };

  const getFilePreview = (file: UploadedFile | File): string | null => {
    if ("url" in file && file.url) {
      return file.url;
    }

    if (file instanceof File && file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }

    return null;
  };

  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            <span>Attach</span>
          </button>

          {(uploadedFiles.length > 0 || uploadingFiles.length > 0) && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {uploadedFiles.length + uploadingFiles.length} file(s)
            </span>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Compact file list */}
        {(uploadedFiles.length > 0 || uploadingFiles.length > 0) && (
          <div className="mt-2 space-y-1">
            {uploadingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-2 text-sm"
              >
                <span>{getFileIcon(file.file.name)}</span>
                <span className="flex-1 truncate">{file.file.name}</span>
                <div className="w-8 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
            ))}
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-2 text-sm"
              >
                <span>{getFileIcon(file.filename)}</span>
                <span className="flex-1 truncate">{file.originalName}</span>
                <button
                  onClick={() => handleRemoveFile(file)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragActive
            ? "border-green-500 bg-green-50 dark:bg-green-900/20 scale-102"
            : "border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div
          className={`transition-all duration-200 ${
            isDragActive ? "scale-110" : ""
          }`}
        >
          <div className="text-6xl mb-4">{isDragActive ? "🎯" : "📎"}</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {isDragActive ? "Drop files here!" : "Upload Files"}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Drag and drop files here, or{" "}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium underline"
            >
              browse
            </button>
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>
              Maximum {maxFiles} files, {maxFileSize}MB each
            </p>
            <p>
              Supported: {acceptedTypes.slice(0, 3).join(", ")}
              {acceptedTypes.length > 3 ? ", ..." : ""}
            </p>
          </div>
        </div>

        {isDragActive && (
          <div className="absolute inset-0 bg-green-500/10 rounded-xl flex items-center justify-center">
            <div className="text-green-600 dark:text-green-400 text-2xl font-bold animate-bounce">
              Drop it like it&apos;s hot! 🔥
            </div>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Uploading Files
          </h4>
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{getFileIcon(file.file.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {file.file.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.file.size)}
                  </p>
                </div>

                {file.status === "uploading" && (
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {Math.round(file.progress)}%
                    </span>
                  </div>
                )}

                {file.status === "completed" && (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm">Complete</span>
                  </div>
                )}

                {file.status === "error" && (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-red-600 dark:text-red-400">
                      <svg
                        className="w-5 h-5 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm">Failed</span>
                    </div>
                    <button
                      onClick={() => handleRetryUpload(file.id)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Attached Files ({uploadedFiles.length})
          </h4>
          <div
            className={`grid gap-4 ${
              showPreviews
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {uploadedFiles.map((file) => (
              <div
                key={file.id || file.filename}
                className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden group hover:shadow-lg transition-shadow"
              >
                {showPreviews && getFilePreview(file) && (
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-600">
                    <Image
                      src={getFilePreview(file)!}
                      alt={file.originalName}
                      className="w-full h-32 object-cover"
                      width={320}
                      height={180}
                      style={{ objectFit: "cover" }}
                      unoptimized={file.url?.startsWith("blob:")}
                    />
                  </div>
                )}

                {/* File Info */}
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl flex-shrink-0">
                      {getFileIcon(file.filename)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-medium text-gray-900 dark:text-white truncate"
                        title={file.originalName}
                      >
                        {file.originalName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)} •{" "}
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* File Actions */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                        title="Download"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </a>
                      <button
                        onClick={() => handleRemoveFile(file)}
                        className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                        title="Remove"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadSystem;
