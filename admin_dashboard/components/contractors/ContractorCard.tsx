'use client';

import type { ContractorProfile } from '@/lib/types/contractor';
import Link from 'next/link';

interface ContractorCardProps {
  contractor: ContractorProfile;
}

export default function ContractorCard({ contractor }: ContractorCardProps) {
  const premiumBadge = contractor.premium_listing !== 'none' && (
    <span className={`px-2 py-1 text-xs font-semibold rounded ${
      contractor.premium_listing === 'featured'
        ? 'bg-[#00FF00] text-black'
        : 'bg-yellow-500 text-black'
    }`}>
      {contractor.premium_listing === 'featured' ? 'Featured' : 'Boosted'}
    </span>
  );

  const verifiedBadge = contractor.is_verified && (
    <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-500 text-white">
      Verified
    </span>
  );

  return (
    <Link href={`/contractors/${contractor.id}`}>
      <div className="bg-[#1A1A1A] border border-[#00FF00]/20 rounded-lg p-6 hover:border-[#00FF00] transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-[#00FF00] mb-1">
              {contractor.business_name}
            </h3>
            {contractor.user && (
              <p className="text-sm text-gray-400">{contractor.user.full_name}</p>
            )}
          </div>
          <div className="flex gap-2">
            {verifiedBadge}
            {premiumBadge}
          </div>
        </div>

        {contractor.description && (
          <p className="text-sm text-gray-300 mb-4 line-clamp-2">
            {contractor.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Services:</span>
            <div className="flex flex-wrap gap-1">
              {contractor.service_types.slice(0, 3).map((service) => (
                <span
                  key={service}
                  className="px-2 py-1 text-xs bg-[#00FF00]/10 text-[#00FF00] rounded"
                >
                  {service}
                </span>
              ))}
              {contractor.service_types.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{contractor.service_types.length - 3} more
                </span>
              )}
            </div>
          </div>

          {contractor.rating_avg && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Rating:</span>
              <span className="text-[#00FF00] font-semibold">
                {contractor.rating_avg.toFixed(1)} ⭐
              </span>
              <span className="text-xs text-gray-500">
                ({contractor.rating_count} reviews)
              </span>
            </div>
          )}

          {contractor.base_rate_per_hour && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Rate:</span>
              <span className="text-white font-semibold">
                ${contractor.base_rate_per_hour}/hr
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

