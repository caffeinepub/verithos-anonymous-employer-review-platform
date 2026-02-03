import React, { useState, useMemo } from 'react';
import { useGetAllOfficialProfileRequests, useApproveOfficialProfileRequest, useRejectOfficialProfileRequest } from '../hooks/useQueries';
import { OfficialProfileRequest } from '../backend';
import { FileText, Calendar, User, Globe, Eye, Shield, CheckCircle, XCircle, Link as LinkIcon, Download, Filter, AlertCircle, ClipboardList, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useFileUrl } from '@/blob-storage/FileStorage';
import AdminSuggestionsPage from './AdminSuggestionsPage';

interface AdminPageProps {
  onNavigate: (page: 'landing' | 'employers' | 'company' | 'blockchain' | 'terms' | 'privacy') => void;
}

function ConfirmationDocumentDisplay({ path }: { path: string }) {
  const { data: fileUrl } = useFileUrl(path);
  const isPdf = path.match(/\.pdf$/i);
  const isImage = path.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  if (!fileUrl) {
    return <span className="text-gray-500 text-sm">Зареждане...</span>;
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = path.split('/').pop() || 'document';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      {/* Inline preview */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        {isPdf ? (
          <iframe
            src={`${fileUrl}#view=FitH`}
            className="w-full h-96"
            title="Документ за потвърждение"
            style={{ backgroundColor: '#525659' }}
          />
        ) : isImage ? (
          <img
            src={fileUrl}
            alt="Документ за потвърждение"
            className="w-full h-auto max-h-96 object-contain"
          />
        ) : (
          <div className="p-4 text-center text-gray-600">
            Преглед не е наличен за този тип файл
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleOpenInNewTab}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 underline text-sm"
        >
          <Eye className="w-4 h-4 mr-1" />
          Отвори в нов раздел
        </button>
        <button
          onClick={handleDownload}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 underline text-sm"
        >
          <Download className="w-4 h-4 mr-1" />
          Изтегли
        </button>
      </div>
    </div>
  );
}

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const { data: requestTuples, isLoading, refetch } = useGetAllOfficialProfileRequests();
  const approveRequest = useApproveOfficialProfileRequest();
  const rejectRequest = useRejectOfficialProfileRequest();
  const [selectedRequest, setSelectedRequest] = useState<{ request: OfficialProfileRequest; key: string } | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Sort and filter requests
  const sortedAndFilteredRequests = useMemo(() => {
    if (!requestTuples) return [];

    let filtered = [...requestTuples];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(([_, request]) => request.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(([_, request]) => {
        return (
          request.companyName.toLowerCase().includes(query) ||
          request.registrationNumber.toLowerCase().includes(query) ||
          request.requestor.toString().toLowerCase().includes(query)
        );
      });
    }

    // Sort by submission date (newest first)
    filtered.sort((a, b) => {
      const timeA = Number(a[1].timestamp);
      const timeB = Number(b[1].timestamp);
      return timeB - timeA; // Descending order
    });

    return filtered;
  }, [requestTuples, statusFilter, searchQuery]);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('bg-BG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Чакащ</span>;
      case 'approved':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">Одобрен</span>;
      case 'rejected':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">Отказан</span>;
      default:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">{status}</span>;
    }
  };

  const handleViewDetails = (request: OfficialProfileRequest, key: string) => {
    setSelectedRequest({ request, key });
    setApprovalError(null); // Clear any previous error
    setIsDetailModalOpen(true);
  };

  const extractErrorMessage = (error: any): string => {
    // Try to extract the error message from various possible formats
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    // Check if error is from IC agent (common format)
    if (error?.toString) {
      const errorStr = error.toString();
      // Extract message from "Call failed: Canister trapped: <message>" format
      const match = errorStr.match(/trapped:\s*(.+?)(?:\n|$)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
      return errorStr;
    }
    
    return 'Възникна неочаквана грешка';
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setApprovalError(null); // Clear any previous error

    // Validate that we have a valid request key
    if (!selectedRequest.key || selectedRequest.key.trim() === '') {
      const errorMsg = 'Грешка: Невалиден идентификатор на заявката';
      setApprovalError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Validate that the request is in pending status
    if (selectedRequest.request.status !== 'pending') {
      const errorMsg = `Не може да се одобри заявка със статус "${selectedRequest.request.status}". Само заявки със статус "pending" могат да бъдат одобрени.`;
      setApprovalError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      await approveRequest.mutateAsync(selectedRequest.key);
      toast.success('Заявката беше одобрена успешно');
      setIsDetailModalOpen(false);
      setSelectedRequest(null);
      // Refresh the list to remove the processed request
      await refetch();
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      console.error('Approval error:', error);
      
      // Display error inline in the modal
      setApprovalError(errorMessage);
      
      // Also show toast for visibility
      toast.error(errorMessage);
      
      // Refresh the list to check if request still exists
      await refetch();
    }
  };

  const handleOpenRejectModal = () => {
    setRejectionReason('');
    setApprovalError(null); // Clear any previous error
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    
    if (!rejectionReason.trim()) {
      toast.error('Моля, въведете причина за отказ');
      return;
    }

    // Validate that we have a valid request key
    if (!selectedRequest.key || selectedRequest.key.trim() === '') {
      const errorMsg = 'Грешка: Невалиден идентификатор на заявката';
      toast.error(errorMsg);
      return;
    }

    // Validate that the request is in pending status
    if (selectedRequest.request.status !== 'pending') {
      const errorMsg = `Не може да се откаже заявка със статус "${selectedRequest.request.status}". Само заявки със статус "pending" могат да бъдат отказани.`;
      toast.error(errorMsg);
      return;
    }

    try {
      await rejectRequest.mutateAsync({ requestKey: selectedRequest.key, reason: rejectionReason.trim() });
      toast.success('Заявката беше отказана успешно');
      setIsRejectModalOpen(false);
      setIsDetailModalOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
      // Refresh the list to remove the processed request
      await refetch();
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      console.error('Rejection error:', error);
      toast.error(errorMessage);
      
      // Refresh the list to check if request still exists
      await refetch();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Зареждане...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-8 h-8 text-blue-900" />
            <h1 className="text-3xl font-bold text-gray-900">Администраторски панел</h1>
          </div>
          <p className="text-gray-600">
            Централен панел за управление на платформата
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="requests">Заявки</TabsTrigger>
            <TabsTrigger value="suggestions">Предложения</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            {/* Header - matching the structure from Предложения tab */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <ClipboardList className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Заявки</h2>
              </div>
              <p className="text-gray-600">
                Преглед и управление на заявки за официални профили
              </p>
            </div>

            {/* Filter Controls - horizontal layout */}
            <div className="mb-4 flex items-center space-x-4">
              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                  Филтър по статус:
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="w-[200px]">
                    <SelectValue placeholder="Всички статуси" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всички статуси</SelectItem>
                    <SelectItem value="pending">Чакащ</SelectItem>
                    <SelectItem value="approved">Одобрен</SelectItem>
                    <SelectItem value="rejected">Отказан</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Търсене по име на фирма, ЕИК или акаунт..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Requests Table */}
            {sortedAndFilteredRequests && sortedAndFilteredRequests.length > 0 ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Име на фирмата
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ЕИК
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Идентификатор на акаунта
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата на подаване
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedAndFilteredRequests.map(([requestKey, request]) => (
                        <tr key={requestKey} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-gray-400 mr-2" />
                              <div className="text-sm font-medium text-gray-900">{request.companyName}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{request.registrationNumber}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <User className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                              <div className="text-sm text-gray-900 font-mono truncate max-w-xs" title={request.requestor.toString()}>
                                {request.requestor.toString().slice(0, 20)}...
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              <div className="text-sm text-gray-900">{formatDate(request.timestamp)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(request.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewDetails(request, requestKey)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Преглед
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Няма заявки</h3>
                <p className="text-gray-600">
                  {searchQuery.trim() 
                    ? `Няма резултати за "${searchQuery}"`
                    : statusFilter === 'all' 
                      ? 'Все още няма подадени заявки за официални профили'
                      : `Няма заявки със статус "${statusFilter === 'pending' ? 'Чакащ' : statusFilter === 'approved' ? 'Одобрен' : 'Отказан'}"`
                  }
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="suggestions">
            <AdminSuggestionsPage />
          </TabsContent>
        </Tabs>

        {/* Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Детайли на заявката</DialogTitle>
              <DialogDescription>
                Преглед на пълната информация за заявката за официален профил
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-6 py-4">
                {/* Error Alert */}
                {approvalError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {approvalError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Име на фирмата
                  </label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{selectedRequest.request.companyName}</span>
                  </div>
                </div>

                {/* Registration Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ЕИК
                  </label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{selectedRequest.request.registrationNumber}</span>
                  </div>
                </div>

                {/* Website */}
                {selectedRequest.request.website && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Уебсайт
                    </label>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <a
                        href={selectedRequest.request.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {selectedRequest.request.website}
                      </a>
                    </div>
                  </div>
                )}

                {/* Trade Register Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Линк към Търговския регистър
                  </label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                    <LinkIcon className="w-5 h-5 text-gray-400" />
                    <a
                      href={selectedRequest.request.tradeRegisterLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {selectedRequest.request.tradeRegisterLink}
                    </a>
                  </div>
                </div>

                {/* Confirmation Document */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Документ за потвърждение
                  </label>
                  <ConfirmationDocumentDisplay path={selectedRequest.request.confirmationDocument} />
                </div>

                {/* Requestor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Идентификатор на акаунта
                  </label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 font-mono text-sm break-all">
                      {selectedRequest.request.requestor.toString()}
                    </span>
                  </div>
                </div>

                {/* Timestamp */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата на подаване
                  </label>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{formatDate(selectedRequest.request.timestamp)}</span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Текущ статус
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {getStatusBadge(selectedRequest.request.status)}
                  </div>
                </div>

                {/* Rejection Reason (if rejected) */}
                {selectedRequest.request.status === 'rejected' && selectedRequest.request.rejectionReason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Причина за отказ
                    </label>
                    <div className="p-3 bg-red-50 rounded-md border border-red-200">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.request.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              {selectedRequest?.request.status === 'pending' ? (
                <>
                  <Button
                    onClick={handleOpenRejectModal}
                    variant="outline"
                    disabled={rejectRequest.isPending || approveRequest.isPending}
                    className="w-full sm:w-auto text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Откажи
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={approveRequest.isPending || rejectRequest.isPending}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  >
                    {approveRequest.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Одобряване...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Одобри
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsDetailModalOpen(false)}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Затвори
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Reason Modal */}
        <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Причина за отказ</DialogTitle>
              <DialogDescription>
                Моля, въведете причина за отказване на заявката. Това поле е задължително.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Label htmlFor="rejection-reason" className="text-sm font-medium text-gray-700 mb-2 block">
                Причина за отказ <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Въведете причина за отказ..."
                className="min-h-[120px]"
                disabled={rejectRequest.isPending}
              />
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => setIsRejectModalOpen(false)}
                variant="outline"
                disabled={rejectRequest.isPending}
                className="w-full sm:w-auto"
              >
                Отказ
              </Button>
              <Button
                onClick={handleConfirmReject}
                disabled={rejectRequest.isPending || !rejectionReason.trim()}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              >
                {rejectRequest.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Отказване...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Потвърди отказ
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
