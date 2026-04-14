import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Download,
  File as FileIcon,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  Loader2,
} from "lucide-react";
import type { Outputs } from "@template/api/types";

type FileMetadata = Outputs["files"]["selectAll"][0];

interface FileDetailViewProps {
  file: FileMetadata;
  fileDataUrl?: string;
  isLoadingPreview?: boolean;
  onBack: () => void;
  onDownload?: () => void;
}

const isImageFile = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const imageExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",
    "bmp",
    "ico",
  ];
  return imageExtensions.includes(extension);
};

const isVideoFile = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const videoExtensions = ["mp4", "avi", "mov", "wmv", "webm", "mkv"];
  return videoExtensions.includes(extension);
};

const isAudioFile = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const audioExtensions = ["mp3", "wav", "ogg", "m4a", "flac", "aac"];
  return audioExtensions.includes(extension);
};

const isPdfFile = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return extension === "pdf";
};

const getFileIcon = (fileName: string) => {
  if (isImageFile(fileName)) {
    return <FileImage className="h-8 w-8 text-blue-500" />;
  }
  if (isVideoFile(fileName)) {
    return <FileVideo className="h-8 w-8 text-purple-500" />;
  }
  if (isAudioFile(fileName)) {
    return <FileAudio className="h-8 w-8 text-green-500" />;
  }
  if (isPdfFile(fileName)) {
    return <FileText className="h-8 w-8 text-red-500" />;
  }
  return <FileIcon className="h-8 w-8 text-gray-500" />;
};

export function FileDetailView({
  file,
  fileDataUrl,
  isLoadingPreview,
  onBack,
  onDownload,
}: FileDetailViewProps) {
  const showImagePreview = isImageFile(file.name) && fileDataUrl;
  const showVideoPreview = isVideoFile(file.name) && fileDataUrl;
  const showAudioPreview = isAudioFile(file.name) && fileDataUrl;
  const showPdfPreview = isPdfFile(file.name) && fileDataUrl;

  return (
    <div className="space-y-6">
      {/* File Preview Section */}
      {isLoadingPreview ? (
        <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/30">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          </div>
        </div>
      ) : showImagePreview ? (
        <div className="border rounded-lg overflow-hidden bg-muted/30">
          <div className="flex items-center justify-center p-4">
            <img
              src={fileDataUrl}
              alt={file.name}
              className="max-w-full max-h-[400px] object-contain rounded"
            />
          </div>
        </div>
      ) : showVideoPreview ? (
        <div className="border rounded-lg overflow-hidden bg-muted/30">
          <video src={fileDataUrl} controls className="w-full max-h-[400px]">
            Your browser does not support the video tag.
          </video>
        </div>
      ) : showAudioPreview ? (
        <div className="border rounded-lg overflow-hidden bg-muted/30 p-4">
          <audio src={fileDataUrl} controls className="w-full">
            Your browser does not support the audio tag.
          </audio>
        </div>
      ) : showPdfPreview ? (
        <div className="border rounded-lg overflow-hidden bg-muted/30">
          <iframe
            src={fileDataUrl}
            className="w-full h-[500px]"
            title={file.name}
          />
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
          <div className="p-3 rounded-lg bg-primary/10">
            {getFileIcon(file.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">ID: {file.id}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>File Name</Label>
          <div className="p-3 border rounded-md bg-muted/30">
            <p className="text-sm">{file.name}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>File ID</Label>
          <div className="p-3 border rounded-md bg-muted/30">
            <p className="text-sm font-mono">{file.id}</p>
          </div>
        </div>

        {file.metadata && Object.keys(file.metadata).length > 0 && (
          <div className="space-y-2">
            <Label>Metadata</Label>
            <div className="p-3 border rounded-md bg-muted/30">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {JSON.stringify(file.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        {onDownload && (
          <Button type="button" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}
      </div>
    </div>
  );
}
