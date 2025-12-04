import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Paperclip, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Attachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  showMentions: boolean;
  filteredUsers?: Array<{ _id: string; name: string }>;
  onMentionSelect: (userName: string) => void;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  attachments,
  onAttachmentsChange,
  showMentions,
  filteredUsers,
  onMentionSelect,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = Array.from(files).map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
    }));

    onAttachmentsChange([...attachments, ...newAttachments]);
  };

  const removeAttachment = (idx: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== idx));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return "🖼️";
    if (type.includes("pdf")) return "📄";
    return "📎";
  };

  return (
    <div className="p-4 border-t">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
            <Badge key={idx} variant="secondary" className="gap-2">
              {getFileIcon(att.type)}
              {att.name}
              <Button
                size="sm"
                variant="ghost"
                className="h-4 w-4 p-0"
                onClick={() => removeAttachment(idx)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2 relative">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <div className="flex-1 relative">
          <Textarea
            placeholder="Type a message... (use @ to mention)"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            className="min-h-[60px] resize-none"
          />

          <AnimatePresence>
            {showMentions && filteredUsers && filteredUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-full left-0 mb-2 w-64 bg-popover border rounded-lg shadow-lg p-2 z-50"
              >
                {filteredUsers.map((user) => (
                  <Button
                    key={user._id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => onMentionSelect(user.name)}
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    {user.name}
                  </Button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button onClick={onSend}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
