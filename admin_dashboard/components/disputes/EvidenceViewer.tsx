'use client';

interface Evidence {
  id: string;
  evidence_url: string;
  evidence_type: string;
  description?: string;
  uploaded_by: string;
  created_at: string;
}

interface EvidenceViewerProps {
  evidence: Evidence[];
}

export default function EvidenceViewer({ evidence }: EvidenceViewerProps) {
  if (!evidence || evidence.length === 0) {
    return (
      <div className="text-gray-400">No evidence submitted</div>
    );
  }

  return (
    <div className="space-y-4">
      {evidence.map((item) => (
        <div
          key={item.id}
          className="border border-gray-700 rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-white font-semibold capitalize">
                {item.evidence_type.replace('_', ' ')}
              </div>
              {item.description && (
                <div className="text-gray-400 text-sm mt-1">{item.description}</div>
              )}
              <div className="text-gray-500 text-xs mt-1">
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <a
              href={item.evidence_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00FF00] hover:underline text-sm"
            >
              View Evidence →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

