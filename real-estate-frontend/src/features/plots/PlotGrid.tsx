import React from 'react';
import type { Plot } from '@/types';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    AVAILABLE: {
        bg: 'bg-emerald-500 hover:bg-emerald-600',
        text: 'text-white',
        label: 'Available',
        dot: 'bg-emerald-500',
    },
    BOOKED: {
        bg: 'bg-amber-400 hover:bg-amber-500',
        text: 'text-black',
        label: 'Booked',
        dot: 'bg-amber-400',
    },
    SOLD: {
        bg: 'bg-red-500 hover:bg-red-600',
        text: 'text-white',
        label: 'Sold',
        dot: 'bg-red-500',
    },
} as const;

// ─── Plot Cell ────────────────────────────────────────────────────────────────
interface PlotCellProps {
    plot: Plot;
    onClick?: (plot: Plot) => void;
}

const PlotCell: React.FC<PlotCellProps> = ({ plot, onClick }) => {
    const config = STATUS_CONFIG[plot.status];

    return (
        <button
            onClick={() => onClick?.(plot)}
            title={`Plot ${plot.plotNumber} — ${plot.status}\nArea: ${plot.area} sqft\nPrice: ₹${plot.price.toLocaleString('en-IN')}`}
            className={`
                ${config.bg} ${config.text}
                rounded-lg p-2 text-center cursor-pointer transition-all duration-150
                shadow-sm hover:shadow-md active:scale-95 select-none
                flex flex-col items-center justify-center gap-0.5 min-h-[56px]
            `}
        >
            <span className="text-xs font-bold leading-none">{plot.plotNumber}</span>
            <span className="text-[9px] opacity-80 leading-none">{plot.area}sqft</span>
        </button>
    );
};

// ─── Plot Grid ────────────────────────────────────────────────────────────────
interface PlotGridProps {
    plots: Plot[];
    onPlotClick?: (plot: Plot) => void;
}

const PlotGrid: React.FC<PlotGridProps> = ({ plots, onPlotClick }) => {
    // Stats
    const available = plots.filter((p) => p.status === 'AVAILABLE').length;
    const booked = plots.filter((p) => p.status === 'BOOKED').length;
    const sold = plots.filter((p) => p.status === 'SOLD').length;

    if (plots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <p className="text-sm">No plots to display in grid view.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Legend + Summary */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Legend items */}
                {(Object.entries(STATUS_CONFIG) as [Plot['status'], typeof STATUS_CONFIG[Plot['status']]][]).map(
                    ([status, config]) => {
                        const count = status === 'AVAILABLE' ? available : status === 'BOOKED' ? booked : sold;
                        return (
                            <div key={status} className="flex items-center gap-2">
                                <div className={`h-3 w-3 rounded-full ${config.dot}`} />
                                <span className="text-sm text-muted-foreground">
                                    {config.label}: <strong className="text-foreground">{count}</strong>
                                </span>
                            </div>
                        );
                    }
                )}
                <span className="ml-auto text-sm text-muted-foreground">
                    Total: <strong className="text-foreground">{plots.length}</strong> plots
                </span>
            </div>

            {/* Occupancy bar */}
            <div className="h-2 w-full rounded-full overflow-hidden flex bg-muted">
                {available > 0 && (
                    <div
                        className="bg-emerald-500 h-full transition-all duration-700"
                        style={{ width: `${(available / plots.length) * 100}%` }}
                    />
                )}
                {booked > 0 && (
                    <div
                        className="bg-amber-400 h-full transition-all duration-700"
                        style={{ width: `${(booked / plots.length) * 100}%` }}
                    />
                )}
                {sold > 0 && (
                    <div
                        className="bg-red-500 h-full transition-all duration-700"
                        style={{ width: `${(sold / plots.length) * 100}%` }}
                    />
                )}
            </div>

            {/* Grid */}
            <div className="grid gap-2"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}
            >
                {plots.map((plot) => (
                    <PlotCell key={plot.id} plot={plot} onClick={onPlotClick} />
                ))}
            </div>

            {/* Tooltip hint */}
            <p className="text-xs text-muted-foreground text-center">
                💡 Hover over a plot cell to see details. Click to interact.
            </p>
        </div>
    );
};

export default PlotGrid;
