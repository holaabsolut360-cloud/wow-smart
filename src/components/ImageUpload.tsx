import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (base64: string) => void;
  label: string;
  hint?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export function ImageUpload({ value, onChange, label, hint, aspectRatio = 'auto' }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona una imagen válida.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const aspectClass = aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'video' ? 'aspect-video' : '';

  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
      
      {value ? (
        <div className={`relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 group ${aspectClass}`}>
          <img src={value} alt="Preview" className={`w-full ${aspectRatio !== 'auto' ? 'h-full object-cover' : 'max-h-[300px] object-contain'} mx-auto`} />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 hover:scale-105 transition-all shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <label 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full min-h-[120px] p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
          } ${aspectClass}`}
        >
          <div className="flex flex-col items-center justify-center text-slate-500">
            <Upload className={`w-8 h-8 mb-3 ${isDragging ? 'text-indigo-500' : 'text-slate-400'}`} />
            <p className="mb-1 text-sm font-semibold text-center">
              <span className="text-indigo-600">Haz clic para subir</span> o arrastra y suelta
            </p>
            <p className="text-xs text-slate-400 text-center">PNG, JPG o WEBP</p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleChange} />
        </label>
      )}
    </div>
  );
}
