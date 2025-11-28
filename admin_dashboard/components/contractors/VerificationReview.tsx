'use client';

import { apiClient } from '@/lib/utils/api';
import { useEffect, useState } from 'react';

interface VerificationDocument {
  id: string;
  contractor_id: string;
  document_type: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  expires_at?: string;
  created_at: string;
}

interface VerificationReviewProps {
  contractorId: string;
}

export default function VerificationReview({ contractorId }: VerificationReviewProps) {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingDoc, setReviewingDoc] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await apiClient.get<{ documents: VerificationDocument[] }>(
          `/admin/contractors/${contractorId}/documents`
        );
        if (response.data) {
          setDocuments(response.data.documents);
        }
      } catch (err) {
        console.error('Failed to load documents:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, [contractorId]);

  const handleReview = async (documentId: string) => {
    try {
      const response = await apiClient.post(`/admin/contractors/${contractorId}/verify`, {
        document_id: documentId,
        status: reviewStatus,
        review_notes: reviewNotes,
      });

      if (response.data) {
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === documentId
              ? {
                  ...doc,
                  status: reviewStatus,
                  review_notes: reviewNotes,
                  reviewed_at: new Date().toISOString(),
                }
              : doc
          )
        );
        setReviewingDoc(null);
        setReviewNotes('');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to review document');
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
        <div className="text-[#00FF00]">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-[#00FF00] mb-4">Verification Documents</h2>

      {documents.length === 0 ? (
        <p className="text-gray-400">No documents submitted</p>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="border border-gray-700 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold capitalize">
                    {doc.document_type.replace('_', ' ')}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Submitted: {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    doc.status === 'approved'
                      ? 'bg-green-500 text-white'
                      : doc.status === 'rejected'
                      ? 'bg-red-500 text-white'
                      : 'bg-yellow-500 text-black'
                  }`}
                >
                  {doc.status}
                </span>
              </div>

              {doc.document_url && (
                <div>
                  <a
                    href={doc.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00FF00] hover:underline text-sm"
                  >
                    View Document →
                  </a>
                </div>
              )}

              {doc.status === 'pending' && (
                <div className="space-y-3 pt-3 border-t border-gray-700">
                  {reviewingDoc === doc.id ? (
                    <div className="space-y-3">
                      <select
                        value={reviewStatus}
                        onChange={(e) =>
                          setReviewStatus(e.target.value as 'approved' | 'rejected')
                        }
                        className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white"
                      >
                        <option value="approved">Approve</option>
                        <option value="rejected">Reject</option>
                      </select>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Review notes (optional)"
                        className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-white"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(doc.id)}
                          className={`flex-1 px-4 py-2 rounded font-semibold ${
                            reviewStatus === 'approved'
                              ? 'bg-[#00FF00] text-black'
                              : 'bg-red-600 text-white'
                          }`}
                        >
                          {reviewStatus === 'approved' ? 'Approve' : 'Reject'}
                        </button>
                        <button
                          onClick={() => {
                            setReviewingDoc(null);
                            setReviewNotes('');
                          }}
                          className="px-4 py-2 bg-gray-700 text-white rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReviewingDoc(doc.id)}
                      className="w-full px-4 py-2 bg-[#00FF00] text-black font-semibold rounded hover:bg-[#00FF00]/90"
                    >
                      Review Document
                    </button>
                  )}
                </div>
              )}

              {doc.review_notes && (
                <div className="pt-3 border-t border-gray-700">
                  <p className="text-sm text-gray-400">Review Notes:</p>
                  <p className="text-white text-sm">{doc.review_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

