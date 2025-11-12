import React from "react";

type FileUploaderProps = {
  onUpload: (files: File[]) => void;
};

const FileUploader: React.FC<FileUploaderProps> = ({ onUpload }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(Array.from(e.target.files));
    }
  };

  return (
    <div>
      <input type="file" multiple accept="image/*" onChange={handleChange} />
    </div>
  );
};

export default FileUploader;
