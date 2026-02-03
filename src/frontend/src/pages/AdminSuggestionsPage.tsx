import React, { useState, useMemo } from 'react';
import { useGetAllSuggestions, useUpdateSuggestionStatus } from '../hooks/useQueries';
import { Suggestion, SuggestionStatus } from '../backend';
import { Lightbulb, Calendar, User, Filter, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminSuggestionsPage() {
  const { data: suggestions, isLoading } = useGetAllSuggestions();
  const updateStatus = useUpdateSuggestionStatus();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);

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

  const getStatusBadge = (status: SuggestionStatus) => {
    switch (status) {
      case SuggestionStatus.new_:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-300">Ново</span>;
      case SuggestionStatus.inReview:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-300">В преглед</span>;
      case SuggestionStatus.planned:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-300">Планирано</span>;
      case SuggestionStatus.implemented:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-300">Реализирано</span>;
      case SuggestionStatus.rejected:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-300">Отхвърлено</span>;
      default:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">Неизвестен</span>;
    }
  };

  const getStatusLabel = (status: SuggestionStatus): string => {
    switch (status) {
      case SuggestionStatus.new_:
        return 'Ново';
      case SuggestionStatus.inReview:
        return 'В преглед';
      case SuggestionStatus.planned:
        return 'Планирано';
      case SuggestionStatus.implemented:
        return 'Реализирано';
      case SuggestionStatus.rejected:
        return 'Отхвърлено';
      default:
        return 'Неизвестен';
    }
  };

  const getStatusSeverity = (status: SuggestionStatus): number => {
    switch (status) {
      case SuggestionStatus.new_:
        return 0;
      case SuggestionStatus.inReview:
        return 1;
      case SuggestionStatus.planned:
        return 2;
      case SuggestionStatus.implemented:
        return 3;
      case SuggestionStatus.rejected:
        return 4;
      default:
        return -1;
    }
  };

  const handleStatusChange = async (suggestion: Suggestion, newStatus: SuggestionStatus) => {
    const currentSeverity = getStatusSeverity(suggestion.status);
    const newSeverity = getStatusSeverity(newStatus);

    // Allow transition to rejected anytime
    if (newStatus !== SuggestionStatus.rejected) {
      // For non-rejected transitions, prevent downgrades
      if (newSeverity < currentSeverity) {
        toast.error('Не може да се понижи статусът на предложението. Разрешени са само повишения или отхвърляне.');
        return;
      }
    }

    try {
      await updateStatus.mutateAsync({ id: suggestion.id, status: newStatus });
      toast.success('Статусът беше променен успешно');
    } catch (error: any) {
      console.error('Error updating status:', error);
      
      // Extract error message from backend
      let errorMessage = 'Възникна грешка при промяна на статуса';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.toString) {
        const errorStr = error.toString();
        const match = errorStr.match(/trapped:\s*(.+?)(?:\n|$)/i);
        if (match && match[1]) {
          errorMessage = match[1].trim();
        }
      }
      
      toast.error(errorMessage);
    }
  };

  // Sort and filter suggestions
  const sortedAndFilteredSuggestions = useMemo(() => {
    if (!suggestions) return [];

    let filtered = [...suggestions];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(suggestion => {
        const statusKey = Object.keys(SuggestionStatus).find(
          key => SuggestionStatus[key as keyof typeof SuggestionStatus] === statusFilter
        );
        return statusKey && suggestion.status === SuggestionStatus[statusKey as keyof typeof SuggestionStatus];
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(suggestion => {
        return (
          suggestion.title.toLowerCase().includes(query) ||
          suggestion.content.toLowerCase().includes(query) ||
          suggestion.sender.toLowerCase().includes(query)
        );
      });
    }

    // Sort by submission date (newest first)
    filtered.sort((a, b) => {
      const timeA = Number(a.timestamp);
      const timeB = Number(b.timestamp);
      return timeB - timeA;
    });

    return filtered;
  }, [suggestions, statusFilter, searchQuery]);

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
    <div className="space-y-6">
      {/* Header - matching the structure from Заявки tab */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Lightbulb className="w-8 h-8 text-amber-500" />
          <h2 className="text-2xl font-bold text-gray-900">Предложения</h2>
        </div>
        <p className="text-gray-600">
          Преглед и управление на предложения от потребители
        </p>
      </div>

      {/* Filter Controls - horizontal layout matching Заявки tab */}
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
              <SelectItem value={SuggestionStatus.new_}>Ново</SelectItem>
              <SelectItem value={SuggestionStatus.inReview}>В преглед</SelectItem>
              <SelectItem value={SuggestionStatus.planned}>Планирано</SelectItem>
              <SelectItem value={SuggestionStatus.implemented}>Реализирано</SelectItem>
              <SelectItem value={SuggestionStatus.rejected}>Отхвърлено</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Търсене по заглавие, съдържание или подател..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Suggestions Table */}
      {sortedAndFilteredSuggestions && sortedAndFilteredSuggestions.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Заглавие
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Подател
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAndFilteredSuggestions.map((suggestion) => (
                  <tr 
                    key={suggestion.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedSuggestion(suggestion)}
                  >
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-start">
                          <Lightbulb className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {suggestion.title}
                            </div>
                            <div className="text-sm text-gray-600 line-clamp-2">
                              {suggestion.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">{formatDate(suggestion.timestamp)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900 font-mono truncate max-w-xs" title={suggestion.sender}>
                          {suggestion.sender === 'Guest' ? 'Гост' : suggestion.sender.slice(0, 20) + '...'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={suggestion.status}
                        onValueChange={(value) => handleStatusChange(suggestion, value as SuggestionStatus)}
                        disabled={updateStatus.isPending}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue>
                            {getStatusBadge(suggestion.status)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={SuggestionStatus.new_}>Ново</SelectItem>
                          <SelectItem value={SuggestionStatus.inReview}>В преглед</SelectItem>
                          <SelectItem value={SuggestionStatus.planned}>Планирано</SelectItem>
                          <SelectItem value={SuggestionStatus.implemented}>Реализирано</SelectItem>
                          <SelectItem value={SuggestionStatus.rejected}>Отхвърлено</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Няма предложения</h3>
          <p className="text-gray-600">
            {searchQuery.trim()
              ? `Няма резултати за "${searchQuery}"`
              : statusFilter === 'all'
                ? 'Все още няма подадени предложения'
                : `Няма предложения със статус "${getStatusLabel(statusFilter as SuggestionStatus)}"`
            }
          </p>
        </div>
      )}

      {/* Suggestion Detail Modal */}
      <Dialog open={!!selectedSuggestion} onOpenChange={() => setSelectedSuggestion(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedSuggestion && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <span>Детайли на предложението</span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Title */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Заглавие
                  </Label>
                  <p className="text-base text-gray-900">{selectedSuggestion.title}</p>
                </div>

                {/* Content */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Съдържание
                  </Label>
                  <p className="text-base text-gray-900 whitespace-pre-wrap">{selectedSuggestion.content}</p>
                </div>

                {/* Sender */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Подател
                  </Label>
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-900 font-mono break-all">
                      {selectedSuggestion.sender === 'Guest' ? 'Гост' : selectedSuggestion.sender}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Дата на подаване
                  </Label>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-900">{formatDate(selectedSuggestion.timestamp)}</p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Текущ статус
                  </Label>
                  <div>{getStatusBadge(selectedSuggestion.status)}</div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
