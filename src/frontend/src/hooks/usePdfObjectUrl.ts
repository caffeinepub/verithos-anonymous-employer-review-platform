import { useEffect, useState } from 'react';

/**
 * Hook that fetches a PDF from a remote URL and returns a blob object URL
 * suitable for inline iframe rendering without triggering auto-download.
 * Automatically cleans up the blob URL on unmount or when the URL changes.
 */
export function usePdfObjectUrl(remoteUrl: string | undefined): {
  blobUrl: string | null;
  isLoading: boolean;
  error: string | null;
} {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!remoteUrl) {
      setBlobUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let objectUrl: string | null = null;
    let isCancelled = false;

    const fetchPdfAsBlob = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(remoteUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        
        if (isCancelled) return;

        // Create blob URL with proper PDF MIME type
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(pdfBlob);
        
        setBlobUrl(objectUrl);
        setIsLoading(false);
      } catch (err) {
        if (isCancelled) return;
        
        console.error('Error fetching PDF as blob:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    fetchPdfAsBlob();

    // Cleanup function
    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [remoteUrl]);

  return { blobUrl, isLoading, error };
}
