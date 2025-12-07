import { FileText, Image, FileSpreadsheet, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface AttachmentPreviewProps {
  attachments: Attachment[];
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export function AttachmentPreview({ attachments }: AttachmentPreviewProps) {
  if (!attachments || attachments.length === 0) return null;

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('attachments').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="mt-4 border-t border-border pt-4">
      <h4 className="font-medium text-sm mb-2">Attachments ({attachments.length})</h4>
      <div className="grid grid-cols-1 gap-2">
        {attachments.map((attachment, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 bg-secondary/50 rounded text-sm"
          >
            {getFileIcon(attachment.type)}
            <span className="flex-1 truncate">{attachment.name}</span>
            <span className="text-xs text-muted-foreground">
              ({formatFileSize(attachment.size)})
            </span>
            <a
              href={getPublicUrl(attachment.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}