import { HttpAgent } from "@icp-sdk/core/agent";
import { useEffect, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";
import { useInternetIdentity } from "./useInternetIdentity";

/**
 * Returns a ready StorageClient wired to the Caffeine blob-storage gateway.
 * The client uses the authenticated identity when available, anonymous otherwise.
 * Files uploaded via putFile() bypass Wasm heap entirely -- bytes go directly
 * to the storage gateway via PUT requests; only the hash is registered on-chain.
 */
export function useStorageClient(): StorageClient | null {
  const { identity } = useInternetIdentity();
  const [client, setClient] = useState<StorageClient | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const config = await loadConfig();
        const agent = new HttpAgent({
          identity: identity ?? undefined,
          host: config.backend_host,
        });

        if (config.backend_host?.includes("localhost")) {
          await agent.fetchRootKey().catch(() => {});
        }

        if (!cancelled) {
          setClient(
            new StorageClient(
              config.bucket_name,
              config.storage_gateway_url,
              config.backend_canister_id,
              config.project_id,
              agent,
            ),
          );
        }
      } catch (err) {
        console.error("[useStorageClient] Failed to initialize:", err);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [identity]);

  return client;
}
