import { useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRegisterFile } from "../hooks/useQueries";
import { useStorageClient } from "../hooks/useStorageClient";

const TEXT_FILE_EXTENSIONS = [".txt", ".csv", ".json", ".md", ".log"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"];

export function SensoryCortexTab() {
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [persistedHash, setPersistedHash] = useState<string | null>(null);
  const [routedAgent, setRoutedAgent] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const storageClient = useStorageClient();
  const registerFile = useRegisterFile();

  if (!isAuthenticated)
    return (
      <div className="mt-10 text-center text-yellow-500">
        Please authenticate.
      </div>
    );

  const handleFileSelect = (file: File) => {
    console.log("[SensoryCortex] File selected:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    setSelectedFile(file);
    setUploadComplete(false);
    setRoutedAgent(null);
    setPersistedHash(null);
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
      console.log("[SensoryCortex] Camera capture:", {
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
      console.log("[SensoryCortex] Manual upload selected:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      handleFileSelect(file);
    }
  };

  /**
   * Two-phase upload:
   * Phase 1 -- StorageClient.putFile(): builds BlobHashTree, fetches certificate
   *            from backend, then sends chunks via PUT to the Caffeine storage
   *            gateway. Wasm heap is never touched -- bytes go directly to the
   *            IC storage layer.
   * Phase 2 -- registerFile(): calls routeDocument() on the backend to record
   *            the blob hash + metadata in the StableBTreeMap so agents can
   *            retrieve the file by hash later.
   */
  const uploadFile = async (file: File) => {
    if (!storageClient) {
      toast.error("Storage client not ready. Please try again.");
      return;
    }

    console.log("[SensoryCortex] Starting blob-storage upload:", {
      filename: file.name,
      size: file.size,
    });

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // --- Phase 1: Persist bytes to the IC storage gateway (Wasm heap bypass) ---
      console.log(
        "[SensoryCortex] Phase 1: Uploading to blob-storage gateway...",
      );
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const { hash } = await storageClient.putFile(bytes, (pct) => {
        setUploadProgress(pct);
        console.log(`[SensoryCortex] Upload progress: ${pct}%`);
      });

      console.log("[SensoryCortex] Phase 1 complete. Blob hash:", hash);
      setPersistedHash(hash);

      // --- Phase 2: Register hash + metadata in backend StableBTreeMap ---
      console.log(
        "[SensoryCortex] Phase 2: Registering file in backend registry...",
      );

      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      let preview = `blob-hash:${hash}`;
      if (TEXT_FILE_EXTENSIONS.includes(ext)) {
        const decoder = new TextDecoder("utf-8");
        const snippet = decoder.decode(
          bytes.slice(0, Math.min(500, bytes.length)),
        );
        preview = `blob-hash:${hash} | preview:${snippet}`;
      } else if (IMAGE_EXTENSIONS.includes(ext)) {
        preview = `blob-hash:${hash} | type:image`;
      }

      const agent = await registerFile.mutateAsync({
        filename: file.name,
        blobHash: preview,
        fileSize: BigInt(file.size),
      });

      console.log("[SensoryCortex] Phase 2 complete. Assigned agent:", agent);
      setRoutedAgent(agent);
      setUploadComplete(true);
      toast.success(
        `"${file.name}" persisted to IC storage. Hash: ${hash.substring(0, 20)}...`,
      );
    } catch (error) {
      console.error("[SensoryCortex] Upload failed:", error);
      toast.error(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    if (selectedFile && !isUploading) {
      console.log("[SensoryCortex] Upload button clicked, starting upload...");
      uploadFile(selectedFile);
    }
  };

  return (
    <div className="space-y-6">
      <div
        data-ocid="sensory.dropzone"
        className="border-2 border-dashed rounded-none p-12 text-center transition-colors"
        style={{
          borderColor: isDragging ? "#39FF14" : "#333",
          backgroundColor: isDragging ? "#2a2a2a" : "#1a1a1a",
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-6xl" style={{ color: "#39FF14" }}>
            📁
          </div>
          <h3 className="text-xl font-bold" style={{ color: "#39FF14" }}>
            Drop File Here
          </h3>
          <p className="text-sm" style={{ color: "#888" }}>
            or use the buttons below
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          data-ocid="sensory.camera.button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
          style={{
            backgroundColor: "#2a2a2a",
            color: "#39FF14",
            border: "2px solid #39FF14",
            borderRadius: "0px",
            padding: "16px",
            cursor: isUploading ? "not-allowed" : "pointer",
            fontWeight: "bold",
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
          style={{ display: "none" }}
        />

        <button
          type="button"
          data-ocid="sensory.upload_button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{
            backgroundColor: "#2a2a2a",
            color: "#39FF14",
            border: "2px solid #39FF14",
            borderRadius: "0px",
            padding: "16px",
            cursor: isUploading ? "not-allowed" : "pointer",
            fontWeight: "bold",
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
          style={{ display: "none" }}
        />
      </div>

      {selectedFile && (
        <div
          className="border rounded-none p-6 space-y-4"
          style={{
            borderColor: "#333",
            backgroundColor: "#2a2a2a",
          }}
        >
          <div>
            <h4 className="font-bold mb-2" style={{ color: "#39FF14" }}>
              Selected File
            </h4>
            <p style={{ color: "#FFA500" }}>{selectedFile.name}</p>
            <p className="text-sm" style={{ color: "#888" }}>
              Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          {isUploading && (
            <div data-ocid="sensory.loading_state">
              <div className="flex justify-between mb-2">
                <span style={{ color: "#39FF14" }}>
                  {uploadProgress < 5
                    ? "Certifying with IC backend..."
                    : uploadProgress < 100
                      ? "Uploading to IC storage gateway..."
                      : "Registering in agent registry..."}
                </span>
                <span style={{ color: "#39FF14" }}>{uploadProgress}%</span>
              </div>
              <div
                className="h-2 rounded-none overflow-hidden"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${uploadProgress}%`,
                    backgroundColor: "#39FF14",
                  }}
                />
              </div>
            </div>
          )}

          {uploadComplete && persistedHash && (
            <div
              data-ocid="sensory.success_state"
              className="border rounded-none p-4 space-y-2"
              style={{
                borderColor: "#39FF14",
                backgroundColor: "#1a1a1a",
              }}
            >
              <p className="font-bold" style={{ color: "#39FF14" }}>
                ✓ Persisted to IC Blob Storage
              </p>
              {routedAgent && (
                <p className="text-sm" style={{ color: "#FFA500" }}>
                  Assigned agent: {routedAgent}
                </p>
              )}
              <p
                className="text-xs font-mono break-all"
                style={{ color: "#888" }}
              >
                Hash: {persistedHash}
              </p>
              <p className="text-xs" style={{ color: "#555" }}>
                File bytes stored via IC storage gateway (Wasm heap bypassed).
                Agents can retrieve this file by hash.
              </p>
            </div>
          )}

          {!isUploading && !uploadComplete && (
            <button
              type="button"
              data-ocid="sensory.primary_button"
              onClick={handleUploadClick}
              disabled={!storageClient}
              style={{
                backgroundColor: storageClient ? "#39FF14" : "#555",
                color: "#1a1a1a",
                border: "none",
                borderRadius: "0px",
                padding: "12px 24px",
                cursor: storageClient ? "pointer" : "not-allowed",
                fontWeight: "bold",
                width: "100%",
              }}
            >
              {storageClient
                ? "Upload & Persist to IC"
                : "Initializing Storage..."}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
