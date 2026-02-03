/**
 * Shared utility for creating ZIP archives from evidence files.
 * Uses the same URL resolution mechanism as single-file downloads via useFileUrl hook.
 * 
 * IMPORTANT: This utility must be used through the useEvidenceArchiveDownload hook
 * to ensure proper URL resolution with authentication.
 */

interface ArchiveResult {
  success: boolean;
  successfulFiles: string[];
  failedFiles: Array<{ fileName: string; path: string; error: string }>;
  zipBlob?: Blob;
}

interface ResolvedFile {
  path: string;
  url: string | null;
  fileName: string;
}

/**
 * Creates a ZIP archive from evidence files using pre-resolved URLs.
 * 
 * @param resolvedFiles - Array of files with pre-resolved URLs from useFileUrl
 * @returns Promise with archive result including success status and file lists
 */
export async function createEvidenceArchive(resolvedFiles: ResolvedFile[]): Promise<ArchiveResult> {
  // Validate input
  if (!resolvedFiles || resolvedFiles.length === 0) {
    throw new Error('Няма файлове за архивиране');
  }

  // Load JSZip from CDN if not already loaded
  if (!(window as any).JSZip) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load JSZip'));
      document.head.appendChild(script);
    });
  }

  const JSZip = (window as any).JSZip;
  const zip = new JSZip();

  // Track successful and failed files
  const successfulFiles: string[] = [];
  const failedFiles: Array<{ fileName: string; path: string; error: string }> = [];

  // Fetch all files using pre-resolved URLs (same as single-file downloads)
  const filePromises = resolvedFiles.map(async (file) => {
    const { path, url, fileName } = file;
    
    try {
      // Skip files without valid URLs
      if (!url) {
        throw new Error('URL не е наличен');
      }
      
      // Fetch using the same URL that useFileUrl provides
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Read as ArrayBuffer for binary safety
      const arrayBuffer = await response.arrayBuffer();
      
      // Validate that file is not empty
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Празен файл');
      }
      
      // Add the actual file content to zip as Uint8Array
      zip.file(fileName, new Uint8Array(arrayBuffer));
      successfulFiles.push(fileName);
      return { success: true, fileName, path };
      
    } catch (error) {
      console.error(`Грешка при зареждане на файл ${path}:`, error);
      failedFiles.push({ 
        fileName, 
        path, 
        error: error instanceof Error ? error.message : 'Неизвестна грешка' 
      });
      return { success: false, fileName, path, error };
    }
  });

  // Wait for all file fetch attempts to complete
  await Promise.all(filePromises);

  // Check if we have any valid files to archive
  if (successfulFiles.length === 0) {
    return {
      success: false,
      successfulFiles: [],
      failedFiles,
    };
  }

  // Create a summary file with download information
  const timestamp = new Date().toLocaleString('bg-BG');
  const summaryContent = `Архив създаден на: ${timestamp}

Общо файлове: ${resolvedFiles.length}
Успешно включени: ${successfulFiles.length}
Неуспешно включени: ${failedFiles.length}

${successfulFiles.length > 0 ? `Успешно включени файлове:
${successfulFiles.map(name => `✓ ${name}`).join('\n')}` : ''}

${failedFiles.length > 0 ? `Неуспешно включени файлове:
${failedFiles.map(item => `✗ ${item.fileName} - ${item.error}`).join('\n')}

Забележка: Някои файлове може да не са достъпни поради временни проблеми със сървъра или мрежата.` : ''}

Този архив е създаден от Verithos платформата.`;
  
  zip.file('_archive_info.txt', summaryContent);

  // Generate the zip file with proper compression
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });

  // Verify the zip blob is valid
  if (!zipBlob || zipBlob.size === 0) {
    throw new Error('Създаденият архив е празен');
  }

  return {
    success: true,
    successfulFiles,
    failedFiles,
    zipBlob,
  };
}

/**
 * Downloads a ZIP archive to the user's device.
 * 
 * @param zipBlob - The ZIP blob to download
 * @param fileCount - Number of files in the archive
 */
export function downloadZipArchive(zipBlob: Blob, fileCount: number): void {
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  
  const dateStr = new Date().toISOString().split('T')[0];
  const fileCountStr = fileCount > 0 ? `${fileCount}_files` : 'info_only';
  link.download = `verithos_evidence_${fileCountStr}_${dateStr}.zip`;
  
  link.style.display = 'none';
  document.body.appendChild(link);
  
  // Force download
  link.click();
  
  // Clean up
  setTimeout(() => {
    try {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError);
    }
  }, 100);
}
