import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSubmitSuggestion } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Lightbulb } from 'lucide-react';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuggestionModal({ isOpen, onClose }: SuggestionModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const submitSuggestion = useSubmitSuggestion();

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Моля, попълнете всички полета');
      return;
    }

    try {
      await submitSuggestion.mutateAsync({ title: title.trim(), content: content.trim() });
      setShowSuccess(true);
      setTitle('');
      setContent('');
    } catch (error: any) {
      console.error('Error submitting suggestion:', error);
      toast.error('Възникна грешка при изпращането на предложението');
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {!showSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <span>Изпрати препоръка</span>
              </DialogTitle>
              <DialogDescription>
                Споделете вашите идеи и предложения за подобряване на платформата
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="suggestion-title" className="text-sm font-medium text-gray-700 mb-2 block">
                  Заглавие <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="suggestion-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Кратко описание на предложението..."
                  disabled={submitSuggestion.isPending}
                  maxLength={200}
                />
              </div>

              <div>
                <Label htmlFor="suggestion-content" className="text-sm font-medium text-gray-700 mb-2 block">
                  Предложение <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="suggestion-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Опишете подробно вашето предложение..."
                  className="min-h-[150px]"
                  disabled={submitSuggestion.isPending}
                  maxLength={2000}
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleClose}
                variant="outline"
                disabled={submitSuggestion.isPending}
                className="w-full sm:w-auto"
              >
                Отказ
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitSuggestion.isPending || !title.trim() || !content.trim()}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-blue-900"
              >
                {submitSuggestion.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-900 mr-2"></div>
                    Изпращане...
                  </>
                ) : (
                  'Изпрати'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-green-600">Предложението е изпратено</DialogTitle>
            </DialogHeader>
            <div className="py-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-700">
                Благодарим ви за вашето предложение! То ще бъде прегледано от нашия екип.
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={handleClose}
                className="w-full bg-amber-500 hover:bg-amber-600 text-blue-900"
              >
                Затвори
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
