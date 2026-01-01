import React from 'react';

interface SearchSkeletonProps {
    count?: number;
    estimatedTime?: number;
}

export const SearchSkeleton: React.FC<SearchSkeletonProps> = ({
    count = 9,
    estimatedTime
}) => {
    return (
        <div className="space-y-4">
            {/* Countdown Timer */}
            {estimatedTime !== undefined && estimatedTime > 0 && (
                <div className="text-center py-2">
                    <p className="text-white/50 text-xs">
                        Estimated time: ~{Math.ceil(estimatedTime)}s
                    </p>
                </div>
            )}

            {/* Skeleton Grid */}
            <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: count }).map((_, index) => (
                    <div
                        key={index}
                        className="aspect-[9/16] bg-white/5 rounded-lg animate-pulse relative overflow-hidden"
                        style={{
                            animationDelay: `${index * 100}ms`
                        }}
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer" />
                    </div>
                ))}
            </div>

            {/* Add shimmer keyframes via inline style */}
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .shimmer {
                    animation: shimmer 1.5s infinite;
                }
            `}</style>
        </div>
    );
};
