import { useEffect, useState, useRef } from 'react';

export type ProgressEvent = {
  jobId: string;
  imageId: string;
  userId: string;
  eventType: string;
  status: string;
  timestamp: string;
  metadata?: any;
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
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled || !endpoint || !apiKey) {
      // Fallback: Simulation mode if not fully configured
      setConnected(true);
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
            setConnected(true);
            
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
        setConnected(true); // Treat as connected so simulation works
      };

      socket.onclose = () => {
        setConnected(false);
      };

      return () => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      };
    } catch (err: any) {
      setError(err?.message || 'Failed to setup real-time listener');
      setConnected(true); // fallback
    }
  }, [endpoint, apiKey, userId, enabled]);

  // Utility to simulate SQS pipeline events
  const runSimulation = (
    jobId: string,
    imageId: string,
    activeStages: string[],
    filterType: string
  ) => {
    if (!connected || (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)) {
      return; // Real AWS is connected, skip simulation
    }

    console.log('Running SQS/Lambda Pipeline simulation for Job:', jobId);
    
    // Define stages based on selection
    const stages = ['startPipeline', ...activeStages, 'compress'];
    let delay = 1000;

    stages.forEach((stage, index) => {
      setTimeout(() => {
        let eventType = 'image.processing.started';
        let metadata: any = { size: 1048576, width: 1920, height: 1080 };

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
