import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CATEGORY_LIST, formatInr } from '../data/civicData';
import type {
  CivicSuggestion,
  InfrastructureCategoryId,
} from '../types/civic';

interface SuggestionModalProps {
  open: boolean;
  defaultCategory: InfrastructureCategoryId;
  defaultLocation?: string;
  defaultAuthor?: string;
  onClose: () => void;
  onSubmit: (
    payload: Omit<CivicSuggestion, 'id' | 'createdAt' | 'status' | 'votes'>,
  ) => void;
}

export function SuggestionModal({
  open,
  defaultCategory,
  defaultLocation,
  defaultAuthor,
  onClose,
  onSubmit,
}: SuggestionModalProps) {
  const [category, setCategory] =
    useState<InfrastructureCategoryId>(defaultCategory);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState(defaultLocation || '');
  const [author, setAuthor] = useState(defaultAuthor || '');
  const [budgetInr, setBudgetInr] = useState('350000');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Standard'>(
    'Medium',
  );
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setCategory(defaultCategory);
      setLocation(defaultLocation || '');
      if (defaultAuthor) setAuthor(defaultAuthor);
    }
  }, [open, defaultCategory, defaultLocation, defaultAuthor]);

  if (!open) return null;

  const parsedBudget = Math.max(10000, Number(budgetInr) || 350000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    onSubmit({
      category,
      title: title.trim(),
      description: description.trim(),
      location: location.trim() || 'Indiranagar 100 Feet Road, Bengaluru',
      author: author.trim() || 'Ananya Rao',
      estimatedBudgetInr: parsedBudget,
      priority,
      hasVoted: true,
    });

    setTitle('');
    setDescription('');
    setLocation('');
    setBudgetInr('350000');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suggestion-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="w-full max-w-lg rounded-lg border border-[#3b494b] bg-[#0e131f] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#252a36] px-6 py-4">
          <h2
            id="suggestion-modal-title"
            className="font-display text-lg font-semibold text-[#dee2f3]"
          >
            Submit Karnataka Infrastructure Proposal
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-md border border-[#3b494b] bg-[#171b27] p-1.5 text-[#b9cacb] hover:text-[#dee2f3] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="proposal-category"
                className="block text-xs font-medium text-[#b9cacb] mb-1.5"
              >
                Infrastructure Category
              </label>
              <select
                id="proposal-category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as InfrastructureCategoryId)
                }
                className="w-full rounded-md border border-[#3b494b] bg-[#171b27] px-3 py-2 text-xs text-[#dee2f3] focus:border-[#00dbe9] focus:outline-none"
              >
                {CATEGORY_LIST.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="proposal-priority"
                className="block text-xs font-medium text-[#b9cacb] mb-1.5"
              >
                Priority Level
              </label>
              <select
                id="proposal-priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as 'High' | 'Medium' | 'Standard')
                }
                className="w-full rounded-md border border-[#3b494b] bg-[#171b27] px-3 py-2 text-xs text-[#dee2f3] focus:border-[#00dbe9] focus:outline-none"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Standard">Standard</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="proposal-title"
              className="block text-xs font-medium text-[#b9cacb] mb-1.5"
            >
              Proposal Title
            </label>
            <input
              id="proposal-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Add pedestrian-activated LED lighting on Brigade Road"
              className="w-full rounded-md border border-[#3b494b] bg-[#171b27] px-3 py-2 text-xs text-[#dee2f3] placeholder:text-[#849495] focus:border-[#00dbe9] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="proposal-location"
                className="block text-xs font-medium text-[#b9cacb] mb-1.5"
              >
                Karnataka Location
              </label>
              <input
                id="proposal-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Koramangala 4th Block"
                className="w-full rounded-md border border-[#3b494b] bg-[#171b27] px-3 py-2 text-xs text-[#dee2f3] placeholder:text-[#849495] focus:border-[#00dbe9] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="proposal-author"
                className="block text-xs font-medium text-[#b9cacb] mb-1.5"
              >
                Your Name
              </label>
              <input
                id="proposal-author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g., Ananya Rao"
                className="w-full rounded-md border border-[#3b494b] bg-[#171b27] px-3 py-2 text-xs text-[#dee2f3] placeholder:text-[#849495] focus:border-[#00dbe9] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="proposal-budget"
                className="block text-xs font-medium text-[#b9cacb] mb-1.5"
              >
                Est. Budget (₹ INR)
              </label>
              <input
                id="proposal-budget"
                type="number"
                min={10000}
                step={5000}
                value={budgetInr}
                onChange={(e) => setBudgetInr(e.target.value)}
                placeholder="350000"
                className="w-full rounded-md border border-[#3b494b] bg-[#171b27] px-3 py-2 text-xs font-mono text-[#dee2f3] placeholder:text-[#849495] focus:border-[#00dbe9] focus:outline-none"
              />
            </div>
          </div>

          <div className="text-[11px] text-[#65f2b5] font-mono">
            Formatted Estimate: {formatInr(parsedBudget)}
          </div>

          <div>
            <label
              htmlFor="proposal-description"
              className="block text-xs font-medium text-[#b9cacb] mb-1.5"
            >
              Proposal Details
            </label>
            <textarea
              id="proposal-description"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the improvement, expected citizen benefit, and exact Karnataka ward placement..."
              className="w-full rounded-md border border-[#3b494b] bg-[#171b27] px-3 py-2 text-xs text-[#dee2f3] placeholder:text-[#849495] focus:border-[#00dbe9] focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#252a36]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#3b494b] bg-[#171b27] px-4 py-2 text-xs font-medium text-[#b9cacb] hover:text-[#dee2f3] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#00dbe9] px-4 py-2 text-xs font-semibold text-[#002022] hover:bg-[#7df4ff] transition-colors cursor-pointer"
            >
              Publish Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
