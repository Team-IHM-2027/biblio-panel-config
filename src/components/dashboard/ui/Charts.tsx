import React from 'react';

export const SimpleBarChart = ({ data }: { data: number[] }) => {
    const max = Math.max(...data, 1);
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    return (
        <div className="flex items-end justify-between h-full w-full pt-4 space-x-2">
            {data.map((value, idx) => (
                <div key={idx} className="flex flex-col items-center w-full group">
                    <div className="relative w-full flex items-end justify-center h-48 bg-gray-50 rounded-t-lg overflow-hidden">
                        <div 
                            style={{ height: `${(value / max) * 100}%` }}
                            className="w-4/5 bg-blue-500 rounded-t transition-all duration-500 group-hover:bg-blue-600 relative"
                        >
                             <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded transition-opacity whitespace-nowrap z-10">
                                {value} prêts
                            </div>
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 mt-2 font-medium">{days[idx]}</span>
                </div>
            ))}
        </div>
    );
};

export const CategoryProgress = ({ label, count, percentage, color }: { label: string, count: number, percentage: number, color: string }) => (
    <div className="mb-4">
        <div className="flex justify-between items-end mb-1">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <span className="text-xs text-gray-500">{count} livres ({percentage}%)</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${percentage}%`, transition: 'width 1s ease-in-out' }}></div>
        </div>
    </div>
);