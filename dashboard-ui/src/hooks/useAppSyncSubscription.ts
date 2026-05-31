import { useEffect, useState, useRef } from 'react';

export type ProgressEvent = {
  jobId: string;
  imageId: string;
  userId: string;
  eventType: string;
  status: string;
  timestamp: string;
  metadata?: ProgressMetadata;
};

export type ProgressMetadata = {
  size?: number;
  width?: number;
  height?: number;
  filter?: string;
  watermark?: string;
  format?: string;
  processingTime?: string | number;
  duration?: string | number;
  elapsedMs?: string | number;
  url?: string;
  s3Key?: string;
  [key: string]: unknown;
};

type AppSyncConfig = {
  endpoint: string;
  apiKey: string;
  userId: string;
  onUpdate: (event: ProgressEvent) => void;
  enabled?: boolean;
};

export function useAppSyncSubscription({
  endpoint,
  apiKey,
  userId,
  onUpdate,
  enabled = false,
}: AppSyncConfig) {
  const shouldSimulate = !enabled || !endpoint || !apiKey;
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const connected = shouldSimulate ? true : isSocketConnected;

  useEffect(() => {
    if (shouldSimulate) {
      return;
    }

    try {
      // AppSync Realtime URL format: replace appsync-api with appsync-realtime-api and append /graphql
      let realtimeUrl = endpoint
        .replace('appsync-api', 'appsync-realtime-api')
        .replace('https://', 'wss://')
        .replace('http://', 'ws://');
      
      if (!realtimeUrl.endsWith('/graphql')) {
        realtimeUrl = `${realtimeUrl}/graphql`;
      }

      // AppSync WebSocket protocol requires base64-encoded headers in the query parameters or sub-protocols
      const host = new URL(endpoint).host;
      const headerObj = {
        host: host,
        'x-api-key': apiKey,
      };
      
      const headerBase64 = btoa(JSON.stringify(headerObj));
      const payloadBase64 = btoa(JSON.stringify({}));
      const fullUrl = `${realtimeUrl}?header=${headerBase64}&payload=${payloadBase64}`;

      const socket = new WebSocket(fullUrl, ['graphql-ws']);
      socketRef.current = socket;

      socket.onopen = () => {
        // Send connection_init
        socket.send(JSON.stringify({ type: 'connection_init' }));
      };

      socket.onmessage = (messageEvent) => {
        try {
          const data = JSON.parse(messageEvent.data);
          
          if (data.type === 'connection_ack') {
            setIsSocketConnected(true);
            
            // Subscribe to onProgressUpdate
            const query = `
              subscription OnProgressUpdate($userId: String!) {
                onProgressUpdate(userId: $userId) {
                  jobId
                  imageId
                  userId
                  eventType
                  status
                  timestamp
                  metadata
                }
              }
            `;
            
            const subscriptionId = 'sub-1';
            const authHeaderObj = {
              host: host,
              'x-api-key': apiKey,
            };

            socket.send(
              JSON.stringify({
                id: subscriptionId,
                type: 'start',
                payload: {
                  data: JSON.stringify({
                    query,
                    variables: { userId },
                  }),
                  extensions: {
                    authorization: authHeaderObj,
                  },
                },
              })
            );
          } else if (data.type === 'data') {
            const progressUpdate = data.payload?.data?.onProgressUpdate;
            if (progressUpdate) {
              onUpdate({
                ...progressUpdate,
                metadata: progressUpdate.metadata
                  ? JSON.parse(progressUpdate.metadata)
                  : {},
              });
            }
          } else if (data.type === 'error') {
            setError(JSON.stringify(data.payload));
          }
        } catch (e) {
          console.error('Error parsing WebSocket message', e);
        }
      };

      socket.onerror = (e) => {
        console.error('WebSocket error', e);
        setError('Connection failed. Switching to Local Simulation mode.');
        setIsSocketConnected(false);
      };

      socket.onclose = () => {
        setIsSocketConnected(false);
      };

      return () => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      };
    } catch (err: unknown) {
      queueMicrotask(() => {
        setError(err instanceof Error ? err.message : 'Failed to setup real-time listener');
        setIsSocketConnected(false);
      });
    }
  }, [endpoint, apiKey, userId, enabled, onUpdate, shouldSimulate]);

  // Utility to simulate SQS pipeline events
  const runSimulation = (
    jobId: string,
    imageId: string,
    activeStages: string[],
    filterType: string
  ) => {
    // Allow simulation to run for development/testing even if a real socket exists.
    // This helps debugging when events are not arriving or for local testing.

    console.log('Running SQS/Lambda Pipeline simulation for Job:', jobId);
    
    // Define stages based on selection
    const stages = ['startPipeline', ...activeStages, 'compress'];
    let delay = 1000;

    stages.forEach((stage) => {
      setTimeout(() => {
        let eventType = 'image.processing.started';
        let metadata: ProgressMetadata = { size: 1048576, width: 1920, height: 1080 };

        if (stage === 'resize') {
          eventType = 'image.resized';
          metadata = { width: 800, height: 600, size: 450280 };
        } else if (stage === 'filter') {
          eventType = 'image.filtered';
          metadata = { filter: filterType, size: 420800 };
        } else if (stage === 'watermark') {
          eventType = 'image.watermarked';
          metadata = { watermark: 'Copyright 2026', size: 430100 };
        } else if (stage === 'compress') {
          eventType = 'image.completed';
          metadata = { format: 'webp', quality: 80, size: 108200, compressionRatio: '89.6%' };
        }

        onUpdate({
          jobId,
          imageId,
          userId,
          eventType,
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
          metadata,
        });
      }, delay);
      
      delay += 2500; // 2.5 seconds between stages to feel realistic and readable
    });
  };

  return { connected, error, runSimulation };
}
