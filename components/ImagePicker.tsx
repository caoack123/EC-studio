
import React, { useRef, useState } from 'react';

interface ImagePickerProps {
  onImageSelected: (base64: string) => void;
  onImagesSelected?: (base64s: string[]) => void;
  label?: string;
  className?: string;
  preview?: string | null;
  multiple?: boolean;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ onImageSelected, onImagesSelected, label, className, preview, multiple }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    if (multiple && onImagesSelected) {
      const promises = Array.from(files).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      Promise.all(promises).then(onImagesSelected);
    } else if (files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => onImageSelected(reader.result as string);
      reader.readAsDataURL(files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[200px] ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white hover:border-indigo-400'
        } ${preview ? 'p-1' : 'p-8'}`}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
        ) : (
          <>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDragging ? 'bg-indigo-100' : 'bg-slate-100'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isDragging ? 'text-indigo-600' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm text-slate-600 font-medium">Drag & Drop or Click to Upload</p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB {multiple ? '(Multiple files supported)' : ''}</p>
          </>
        )}
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => handleFiles(e.target.files)} 
        className="hidden" 
        accept="image/*"
        multiple={multiple}
      />
    </div>
  );
};

export default ImagePicker;
