import { FileText, X, Upload, Image as ImageIcon, FileSpreadsheet, File } from 'lucide-react';
import type { Document } from '../lib/supabase';

type Props = {
  documents: Document[];
  onRemove: (id: string) => void;
  onUpload: (file: File) => void;
  onImageUpload: (file: File) => void;
};

const FILE_ICONS: Record<string, typeof FileText> = {
  image: ImageIcon,
  pdf: FileText,
  docx: FileSpreadsheet,
  ppt: File,
  text: FileText,
};

export default function DocumentPanel({ documents, onRemove, onUpload, onImageUpload }: Props) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      onImageUpload(file);
    } else {
      onUpload(file);
    }
    e.target.value = '';
  };

  const getIcon = (doc: Document) => {
    const Icon = FILE_ICONS[doc.file_type] || FileText;
    return <Icon size={12} />;
  };

  return (
    <div className="glass border-b border-[#2a3942]/50 px-3 md:px-4 py-2">
      <div className="flex items-center gap-2 flex-wrap">
        <label
          className="doc-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2a3942] hover:bg-[#3a4a54] cursor-pointer transition-colors text-xs text-[#aebac1]"
          title="Upload document or image"
        >
          <Upload size={13} />
          <span>Add file</span>
          <input
            type="file"
            accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.md,image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {documents.map(doc => (
          <div
            key={doc.id}
            className={`doc-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full max-w-[200px] ${
              doc.file_type === 'image'
                ? 'bg-[#00a884]/20 border border-[#00a884]/30 text-[#00a884]'
                : 'bg-[#2a3942] text-[#aebac1]'
            } text-xs`}
          >
            {getIcon(doc)}
            <span className="truncate">{doc.filename}</span>
            <button
              onClick={() => onRemove(doc.id)}
              className="ml-0.5 hover:text-white transition-colors flex-shrink-0 hover:scale-125"
            >
              <X size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
