import { useState, useRef } from 'react';
import { useRouteDocument } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

const CHUNK_SIZE = 1_800_000;
const TEXT_FILE_EXTENSIONS = ['.txt', '.csv', '.json', '.md', '.log'];
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];

export function SensoryCortexTab() {
  const { identity } = useInternetIdentity();
  
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [routedAgent, setRoutedAgent] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const routeDocument = useRouteDocument();

  if (!isAuthenticated) return <div className="mt-10 text-center text-yellow-500">Please authenticate.</div>;

  const handleFileSelect = (file: File) => {
    console.log('[SensoryCortex] File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    setSelectedFile(file);
    setUploadComplete(false);
    setRoutedAgent(null);
    setUploadProgress(0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('[SensoryCortex] Camera capture:', {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      handleFileSelect(file);
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('[SensoryCortex] Manual upload selected:', {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      handleFileSelect(file);
    }
  };

  const processFileInChunks = async (file: File) => {
    console.log('[SensoryCortex] Starting chunked upload:', {
      filename: file.name,
      totalSize: file.size,
      chunkSize: CHUNK_SIZE,
      estimatedChunks: Math.ceil(file.size / CHUNK_SIZE),
    });

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      let processedBytes = 0;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        console.log(`[SensoryCortex] Processing chunk ${chunkIndex + 1}/${totalChunks}:`, {
          start,
          end,
          chunkSize: chunk.size,
        });

        const arrayBuffer = await chunk.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        let preview = '';

        if (TEXT_FILE_EXTENSIONS.includes(fileExtension)) {
          const decoder = new TextDecoder('utf-8');
          const text = decoder.decode(uint8Array.slice(0, Math.min(500, uint8Array.length)));
          preview = text;
          console.log('[SensoryCortex] Text preview generated:', preview.substring(0, 100));
        } else if (IMAGE_EXTENSIONS.includes(fileExtension)) {
          preview = `[Image: ${file.name}, ${file.size} bytes]`;
          console.log('[SensoryCortex] Image preview generated:', preview);
        } else {
          preview = `[Binary file: ${file.name}, ${file.size} bytes]`;
          console.log('[SensoryCortex] Binary preview generated:', preview);
        }

        console.log(`[SensoryCortex] Calling backend routeDocument for chunk ${chunkIndex + 1}...`);
        const assignedAgent = await routeDocument.mutateAsync({
          filename: `${file.name}_chunk_${chunkIndex + 1}_of_${totalChunks}`,
          filePreview: preview,
          fileSize: BigInt(chunk.size),
        });

        console.log(`[SensoryCortex] Chunk ${chunkIndex + 1} routed to:`, assignedAgent);

        processedBytes += chunk.size;
        const progress = Math.round((processedBytes / file.size) * 100);
        setUploadProgress(progress);
        console.log(`[SensoryCortex] Upload progress: ${progress}%`);

        if (chunkIndex === 0) {
          setRoutedAgent(assignedAgent);
        }
      }

      console.log('[SensoryCortex] All chunks processed successfully');
      setUploadComplete(true);
      toast.success(`File "${file.name}" uploaded and routed successfully!`);
    } catch (error) {
      console.error('[SensoryCortex] Upload failed:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    if (selectedFile && !isUploading) {
      console.log('[SensoryCortex] Upload button clicked, starting upload...');
      processFileInChunks(selectedFile);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed rounded-none p-12 text-center transition-colors"
        style={{
          borderColor: isDragging ? '#39FF14' : '#333',
          backgroundColor: isDragging ? '#2a2a2a' : '#1a1a1a',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-6xl" style={{ color: '#39FF14' }}>
            📁
          </div>
          <h3 className="text-xl font-bold" style={{ color: '#39FF14' }}>
            Drop File Here
          </h3>
          <p className="text-sm" style={{ color: '#888' }}>
            or use the buttons below
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
          style={{
            backgroundColor: '#2a2a2a',
            color: '#39FF14',
            border: '2px solid #39FF14',
            borderRadius: '0px',
            padding: '16px',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: isUploading ? 0.5 : 1,
          }}
          className="flex items-center justify-center gap-2"
        >
          📷 Capture from Camera
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          style={{ display: 'none' }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{
            backgroundColor: '#2a2a2a',
            color: '#39FF14',
            border: '2px solid #39FF14',
            borderRadius: '0px',
            padding: '16px',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: isUploading ? 0.5 : 1,
          }}
          className="flex items-center justify-center gap-2"
        >
          📂 Browse Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleManualUpload}
          style={{ display: 'none' }}
        />
      </div>

      {selectedFile && (
        <div
          className="border rounded-none p-6 space-y-4"
          style={{
            borderColor: '#333',
            backgroundColor: '#2a2a2a',
          }}
        >
          <div>
            <h4 className="font-bold mb-2" style={{ color: '#39FF14' }}>
              Selected File
            </h4>
            <p style={{ color: '#FFA500' }}>{selectedFile.name}</p>
            <p className="text-sm" style={{ color: '#888' }}>
              Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          {isUploading && (
            <div>
              <div className="flex justify-between mb-2">
                <span style={{ color: '#39FF14' }}>Uploading...</span>
                <span style={{ color: '#39FF14' }}>{uploadProgress}%</span>
              </div>
              <div
                className="h-2 rounded-none overflow-hidden"
                style={{ backgroundColor: '#1a1a1a' }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${uploadProgress}%`,
                    backgroundColor: '#39FF14',
                  }}
                />
              </div>
            </div>
          )}

          {uploadComplete && routedAgent && (
            <div
              className="border rounded-none p-4"
              style={{
                borderColor: '#39FF14',
                backgroundColor: '#1a1a1a',
              }}
            >
              <p className="font-bold" style={{ color: '#39FF14' }}>
                ✓ Routed to: {routedAgent}
              </p>
            </div>
          )}

          {!isUploading && !uploadComplete && (
            <button
              onClick={handleUploadClick}
              style={{
                backgroundColor: '#39FF14',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '0px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontWeight: 'bold',
                width: '100%',
              }}
            >
              Upload & Route
            </button>
          )}
        </div>
      )}
    </div>
  );
}
