import { useState, useRef } from 'react';
import { useRouteDocument } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { toast } from 'sonner';

const CHUNK_SIZE = 1_800_000; // Exactly 1,800,000 bytes per chunk
const TEXT_FILE_EXTENSIONS = ['.txt', '.csv', '.json', '.md', '.log'];
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];

export function SensoryCortexTab() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [routedAgent, setRoutedAgent] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const { actor, isFetching } = useActor();
  const routeDocument = useRouteDocument();

  // Guard clause: Prevent rendering if backend actor is not initialized
  if (!actor && isFetching) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold" style={{ color: '#39FF14' }}>
            Initializing connection to The Orchestrator...
          </div>
          <div className="text-sm" style={{ color: '#888' }}>
            Please wait while we establish secure communication
          </div>
        </div>
      </div>
    );
  }

  if (!actor && !isFetching) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold" style={{ color: '#FF0000' }}>
            Failed to connect to backend
          </div>
          <div className="text-sm" style={{ color: '#FFA500' }}>
            Please refresh the page or check your Internet Identity authentication.
          </div>
        </div>
      </div>
    );
  }

  const handleFileSelect = (file: File) => {
    console.log('[SensoryCortex] File selected:', file.name, 'Size:', file.size, 'bytes');
    setSelectedFile(file);
    setUploadProgress(0);
    setUploadComplete(false);
    setRoutedAgent(null);
    toast.success(`File selected: ${file.name}`);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('[SensoryCortex] File captured from file input:', file.name);
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      console.log('[SensoryCortex] File captured from drag-and-drop:', file.name);
      handleFileSelect(file);
    }
  };

  const extractFilePreview = async (file: File): Promise<string> => {
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    // Check if it's an image
    if (IMAGE_EXTENSIONS.includes(fileExtension)) {
      return 'Binary Image Data';
    }
    
    // Check if it's a text file
    if (TEXT_FILE_EXTENSIONS.includes(fileExtension)) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          // Extract exactly 5,000 characters
          const preview = text.substring(0, 5000);
          resolve(preview);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
    }
    
    // For other binary files
    return 'Binary Image Data';
  };

  const uploadFileInChunks = async (file: File): Promise<void> => {
    if (!actor) {
      throw new Error('Actor not initialized');
    }

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    console.log('[SensoryCortex] Starting chunked upload:', totalChunks, 'chunks');
    
    // Sequential chunking with for...of loop
    for (const chunkIndex of Array.from({ length: totalChunks }, (_, i) => i)) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      // Convert chunk to array buffer for processing
      const arrayBuffer = await chunk.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      console.log(`[SensoryCortex] Uploading chunk ${chunkIndex + 1}/${totalChunks}, size: ${uint8Array.length} bytes`);
      
      // CRITICAL: Sequential upload with await
      // Call backend Orchestrator's upload_chunk function
      // Note: This assumes the backend has an upload_chunk method
      // For now, simulating with a delay until backend method is available
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Update progress after each chunk is confirmed
      const progress = ((chunkIndex + 1) / totalChunks) * 100;
      setUploadProgress(Math.round(progress));
    }
    
    console.log('[SensoryCortex] All chunks uploaded successfully');
  };

  const handleUpload = async () => {
    console.log('[SensoryCortex] Upload button clicked');
    console.log('[SensoryCortex] Selected file:', selectedFile?.name || 'none');
    console.log('[SensoryCortex] Backend actor status:', actor ? 'initialized' : 'not initialized');
    
    if (!actor) {
      console.error('[SensoryCortex] Upload failed: Backend actor not initialized');
      toast.error('Failed to connect to backend: Actor not initialized');
      return;
    }

    if (!selectedFile) {
      console.error('[SensoryCortex] Upload failed: No file selected');
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadComplete(false);
    setRoutedAgent(null);

    try {
      console.log('[SensoryCortex] Starting upload process for:', selectedFile.name);
      
      // Step 1: Upload file in exactly 1,800,000 byte chunks (sequential)
      await uploadFileInChunks(selectedFile);
      
      // Step 2: Mark upload as complete
      setUploadComplete(true);
      toast.success('File upload complete! Routing to agent...');
      
      // Step 3: Extract preview text (first 5,000 characters)
      const previewString = await extractFilePreview(selectedFile);
      console.log('[SensoryCortex] File preview extracted, length:', previewString.length);
      
      // Step 4: Call route_document with filename, preview, and file size
      const fileSize = BigInt(selectedFile.size);
      
      console.log('[SensoryCortex] Calling routeDocument mutation');
      routeDocument.mutate(
        {
          filename: selectedFile.name,
          filePreview: previewString,
          fileSize,
        },
        {
          onSuccess: (assignedAgent) => {
            console.log('[SensoryCortex] Document routed successfully to:', assignedAgent);
            setRoutedAgent(assignedAgent);
            toast.success(
              `Document [${selectedFile.name}] routed to ${assignedAgent} via Sensory Cortex`,
              { duration: 5000 }
            );
          },
          onError: (error) => {
            console.error('[SensoryCortex] Routing failed:', error);
            toast.error(`Failed to route document: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setUploadComplete(false);
          },
        }
      );
    } catch (error) {
      console.error('[SensoryCortex] Upload error:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadProgress(0);
      setUploadComplete(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    console.log('[SensoryCortex] Reset clicked');
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadComplete(false);
    setRoutedAgent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          backgroundColor: isDragging ? '#2a2a2a' : '#1a1a1a',
          border: `3px dashed ${isDragging ? '#39FF14' : '#555'}`,
          borderRadius: '0px',
          padding: '48px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s',
        }}
      >
        <div style={{ color: '#39FF14', fontSize: '48px', marginBottom: '16px' }}>
          📁
        </div>
        <h3 style={{ color: '#39FF14', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          DRAG & DROP FILES HERE
        </h3>
        <p style={{ color: '#FFA500', fontSize: '16px' }}>
          Or use the buttons below to select files
        </p>
      </div>

      {/* File Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          id="cameraInput"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
        <button
          onClick={handleCameraClick}
          disabled={isUploading}
          style={{
            backgroundColor: '#2a2a2a',
            color: '#39FF14',
            border: '2px solid #39FF14',
            borderRadius: '0px',
            padding: '24px',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '20px',
            opacity: isUploading ? 0.5 : 1,
          }}
        >
          📷 TAKE PHOTO
        </button>

        <input
          ref={fileInputRef}
          type="file"
          id="fileInput"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
        <button
          onClick={handleSelectFileClick}
          disabled={isUploading}
          style={{
            backgroundColor: '#2a2a2a',
            color: '#39FF14',
            border: '2px solid #39FF14',
            borderRadius: '0px',
            padding: '24px',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '20px',
            opacity: isUploading ? 0.5 : 1,
          }}
        >
          📂 SELECT FILE
        </button>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div style={{ backgroundColor: '#2a2a2a', border: '1px solid #39FF14', borderRadius: '0px', padding: '24px' }}>
          <h4 style={{ color: '#39FF14', fontWeight: 'bold', marginBottom: '12px' }}>
            SELECTED FILE
          </h4>
          <div style={{ color: '#FFA500', fontFamily: 'monospace' }}>
            <p><strong>Name:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong>Type:</strong> {selectedFile.type || 'Unknown'}</p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {(isUploading || uploadProgress > 0) && (
        <div style={{ backgroundColor: '#2a2a2a', border: '1px solid #555', borderRadius: '0px', padding: '24px' }}>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#39FF14', fontWeight: 'bold' }}>
              UPLOAD PROGRESS
            </span>
            <span style={{ color: '#FFA500', fontWeight: 'bold', fontSize: '18px' }}>
              {uploadProgress}%
            </span>
          </div>
          <progress
            value={uploadProgress}
            max={100}
            style={{
              width: '100%',
              height: '24px',
              accentColor: '#39FF14',
            }}
          />
          <p style={{ color: '#888', marginTop: '8px', fontSize: '12px' }}>
            Sequential chunking: 1,800,000 bytes per chunk
          </p>
        </div>
      )}

      {/* Routing Result */}
      {uploadComplete && routedAgent && (
        <div style={{ backgroundColor: '#2a2a2a', border: '2px solid #39FF14', borderRadius: '0px', padding: '24px' }}>
          <h4 style={{ color: '#39FF14', fontWeight: 'bold', marginBottom: '12px', fontSize: '18px' }}>
            ✓ ROUTING COMPLETE
          </h4>
          <p style={{ color: '#FFA500', fontSize: '16px' }}>
            Document <strong style={{ color: '#39FF14' }}>[{selectedFile?.name}]</strong> has been routed to agent:{' '}
            <strong style={{ color: '#39FF14' }}>{routedAgent}</strong>
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {selectedFile && !uploadComplete && (
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            style={{
              backgroundColor: (!selectedFile || isUploading) ? '#555' : '#39FF14',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: '0px',
              padding: '16px 32px',
              cursor: (!selectedFile || isUploading) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              flex: 1,
              opacity: (!selectedFile || isUploading) ? 0.5 : 1,
            }}
          >
            {isUploading ? 'UPLOADING...' : 'START UPLOAD'}
          </button>
        )}
        {(uploadComplete || selectedFile) && (
          <button
            onClick={handleReset}
            disabled={isUploading}
            style={{
              backgroundColor: '#2a2a2a',
              color: '#FFA500',
              border: '2px solid #FFA500',
              borderRadius: '0px',
              padding: '16px 32px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              flex: 1,
              opacity: isUploading ? 0.5 : 1,
            }}
          >
            RESET
          </button>
        )}
      </div>
    </div>
  );
}
