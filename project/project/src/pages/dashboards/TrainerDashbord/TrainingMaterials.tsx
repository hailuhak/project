import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  File,
  Download,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { db } from '../../../lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore';

interface Material {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  description?: string;
  content: string; // base64
}

interface FileWithDescription {
  file: File;
  description: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export const TrainingMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [uploadQueue, setUploadQueue] = useState<FileWithDescription[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>(
    {}
  );
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000
    );
  };

  useEffect(() => {
    const fetchMaterials = async () => {
      const q = query(
        collection(db, 'trainingMaterials'),
        orderBy('uploadedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => {
        const mat = doc.data() as Omit<Material, 'id'>;
        return {
          id: doc.id,
          ...mat,
          uploadedAt: mat.uploadedAt.toDate
            ? mat.uploadedAt.toDate()
            : new Date(mat.uploadedAt),
        };
      });
      setMaterials(data);
    };
    fetchMaterials();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files).map((file) => ({
      file,
      description: '',
    }));
    setUploadQueue((prev) => [...prev, ...filesArray]);
  };

  const updateDescription = (index: number, desc: string) => {
    setUploadQueue((prev) => {
      const newQueue = [...prev];
      newQueue[index].description = desc;
      return newQueue;
    });
  };

  const startUpload = (fileWithDesc: FileWithDescription) => {
    const { file, description } = fileWithDesc;
    const reader = new FileReader();
    reader.readAsDataURL(file);

    setUploadingFiles((prev) => ({ ...prev, [file.name]: true }));

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
      }
    };

    reader.onload = async () => {
      const base64Content = reader.result as string;

      try {
        const docRef = await addDoc(collection(db, 'trainingMaterials'), {
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: Timestamp.now(),
          description,
          content: base64Content,
        });

        // Add to materials only after Firestore save is complete
        setMaterials((prev) => [
          {
            id: docRef.id,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date(),
            description,
            content: base64Content,
          },
          ...prev,
        ]);

        setUploadQueue((prev) =>
          prev.filter((f) => f.file.name !== file.name)
        );

        showToast(`File "${file.name}" uploaded successfully!`, 'success');
      } catch (error) {
        console.error('Upload error:', error);
        showToast(`Error uploading "${file.name}"`, 'error');
      } finally {
        setUploadProgress((prev) => {
          const updated = { ...prev };
          delete updated[file.name];
          return updated;
        });
        setUploadingFiles((prev) => {
          const updated = { ...prev };
          delete updated[file.name];
          return updated;
        });
      }
    };

    reader.onerror = (error) => {
      console.error('File read error:', error);
      showToast(`Error uploading "${fileWithDesc.file.name}"`, 'error');
      setUploadingFiles((prev) => {
        const updated = { ...prev };
        delete updated[fileWithDesc.file.name];
        return updated;
      });
    };
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await deleteDoc(doc(db, 'trainingMaterials', materialId));
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      showToast('File deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting material:', error);
      showToast('Error deleting file', 'error');
    }
  };

  const getFileIcon = (type: string) => {
    const baseStyle = 'w-10 h-10 text-white';
    if (type.includes('pdf'))
      return <FileText className={baseStyle + ' text-red-500'} />;
    if (type.includes('image'))
      return <ImageIcon className={baseStyle + ' text-green-500'} />;
    if (type.includes('video'))
      return <VideoIcon className={baseStyle + ' text-purple-500'} />;
    return <File className={baseStyle + ' text-blue-500'} />;
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast messages */}
      <div className="fixed top-5 right-5 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded shadow-lg text-sm font-medium transition-transform transform
              ${
                toast.type === 'success'
                  ? 'bg-green-500 text-white dark:bg-green-600'
                  : 'bg-red-500 text-white dark:bg-red-600'
              }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Training Materials
        </h1>
        <Button
          onClick={() =>
            document.getElementById('materialUpload')?.click()
          }
        >
          <Upload className="w-4 h-4 mr-2" /> Upload File
        </Button>
        <input
          type="file"
          id="materialUpload"
          className="hidden"
          multiple
          onChange={handleFileSelect}
        />
      </div>

      {/* Upload queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-4">
          {uploadQueue.map((item, idx) => {
            const isUploading = !!uploadingFiles[item.file.name];

            return (
              <div
                key={item.file.name}
                className="flex items-center gap-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-sm"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {getFileIcon(item.file.type)}
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900 dark:text-white">
                      {Math.round(uploadProgress[item.file.name])}%
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {item.file.name}
                  </span>
                  <input
                    type="text"
                    placeholder="Add a description..."
                    value={item.description}
                    onChange={(e) =>
                      updateDescription(idx, e.target.value)
                    }
                    className="mt-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    disabled={isUploading}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {(item.file.size / 1024).toFixed(2)} KB
                  </span>
                </div>

                <Button
                  onClick={() => startUpload(item)}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    'Send'
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Uploaded materials */}
      <div className="flex flex-col gap-3">
        {materials.map((mat) => (
          <div
            key={mat.id}
            className="flex items-center gap-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-sm"
          >
            <div>{getFileIcon(mat.type)}</div>
            <div className="flex-1 flex flex-col">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {mat.name}
              </span>
              {mat.description && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {mat.description}
                </span>
              )}
              <span className="text-xs text-gray-400 dark:text-gray-400">
                {(mat.size / 1024).toFixed(2)} KB
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = mat.content;
                  link.download = mat.name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                className="flex items-center gap-1"
                onClick={() => handleDelete(mat.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
