"use client";

import React, { useRef } from "react";
import {
  Paperclip,
  UploadCloud,
  FileImage,
  FileText,
  Download,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { taskService } from "@/services/task-service";
import { formatTimeAgo } from "@/lib/date-utils";
import type { AttachmentResponse } from "@/services/generated/api-types";

export interface TaskAttachmentsTabProps {
  organizationId: string;
  projectId: string;
  taskId: string;
  attachments: AttachmentResponse[];
  isUploadingAttachment: boolean;
  onFileUpload: (files: FileList | null) => void;
  onDeleteAttachmentClick: (att: AttachmentResponse) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function TaskAttachmentsTab({
  organizationId,
  projectId,
  taskId,
  attachments,
  isUploadingAttachment,
  onFileUpload,
  onDeleteAttachmentClick,
}: TaskAttachmentsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Attachments</h3>
          <span className="text-xs text-muted-foreground">
            ({attachments.length})
          </span>
        </div>

        {/* File upload trigger */}
        <label className="cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              onFileUpload(e.target.files);
              e.target.value = "";
            }}
            disabled={isUploadingAttachment}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2.5 text-xs"
            disabled={isUploadingAttachment}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>
              {isUploadingAttachment ? "Uploading..." : "Upload File"}
            </span>
          </Button>
        </label>
      </div>

      {/* Dropzone hint */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFileUpload(e.dataTransfer.files);
        }}
        className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border py-4 text-center transition-colors hover:border-primary/50 hover:bg-muted/10"
      >
        <UploadCloud className="mb-1 h-5 w-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Click or drag and drop files (Max 10MB)
        </p>
      </div>

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <p className="py-2 text-center text-xs italic text-muted-foreground">
          No attachments yet
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {attachments.map((att) => {
            const isImage = att.content_type?.startsWith("image/") ?? false;
            const downloadUrl = taskService.getAttachmentDownloadUrl(
              organizationId,
              projectId,
              taskId,
              att.id
            );

            return (
              <div
                key={att.id}
                className="flex items-center justify-between rounded-md border border-border/60 bg-muted/20 p-2 text-xs"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {isImage ? (
                    <FileImage className="h-5 w-5 shrink-0 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="truncate">
                    <p className="truncate font-medium text-foreground">
                      {att.file_name || (att as any).filename}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatBytes(att.file_size)} •{" "}
                      {formatTimeAgo(att.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={att.file_name || (att as any).filename}
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteAttachmentClick(att)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
