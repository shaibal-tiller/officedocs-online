import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Paperclip, X, FileText, Image, FileSpreadsheet, Loader2 } from "lucide-react";

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface FileAttachmentsProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  disabled?: boolean;
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

export function FileAttachments({ attachments, onAttachmentsChange, disabled }: FileAttachmentsProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload files",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const newAttachments: Attachment[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file);

      if (uploadError) {
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}: ${uploadError.message}`,
          variant: "destructive",
        });
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName);

      newAttachments.push({
        name: file.name,
        url: fileName,
        type: file.type,
        size: file.size,
      });
    }

    onAttachmentsChange([...attachments, ...newAttachments]);
    setUploading(false);
    
    if (newAttachments.length > 0) {
      toast({
        title: "Files uploaded",
        description: `${newAttachments.length} file(s) uploaded successfully`,
      });
    }

    // Reset input
    e.target.value = '';
  };

  const handleRemove = async (index: number) => {
    const attachment = attachments[index];
    
    const { error } = await supabase.storage
      .from('attachments')
      .remove([attachment.url]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove file",
        variant: "destructive",
      });
      return;
    }

    const newAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(newAttachments);
  };

  const handleDownload = async (attachment: Attachment) => {
    const { data, error } = await supabase.storage
      .from('attachments')
      .download(attachment.url);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <Label>Attachments</Label>
      
      <div className="flex items-center gap-2">
        <Input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
          onChange={handleFileUpload}
          disabled={disabled || uploading}
          className="flex-1"
        />
        {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Supported: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, GIF (max 10MB each)
      </p>

      {attachments.length > 0 && (
        <div className="space-y-2 mt-3">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-muted rounded-md"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getFileIcon(attachment.type)}
                <span className="truncate text-sm">{attachment.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({formatFileSize(attachment.size)})
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
