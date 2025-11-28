'use client';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
}

interface FAQListProps {
  faqs: FAQ[];
  onEdit: (faq: FAQ) => void;
  onDelete: (id: string) => void;
}

export default function FAQList({ faqs, onEdit, onDelete }: FAQListProps) {
  return (
    <div className="space-y-4">
      {faqs.map((faq) => (
        <div
          key={faq.id}
          className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 text-xs font-semibold rounded bg-[#00FF00]/20 text-[#00FF00]">
                  {faq.category}
                </span>
                <span className="text-gray-500 text-sm">Order: {faq.order}</span>
              </div>
              <h3 className="text-xl font-semibold text-[#00FF00] mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-300">{faq.answer}</p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEdit(faq)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(faq.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}

      {faqs.length === 0 && (
        <div className="text-center py-12 text-gray-400">No FAQs found</div>
      )}
    </div>
  );
}

