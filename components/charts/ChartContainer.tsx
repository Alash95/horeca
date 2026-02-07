import { FC, ReactNode } from 'react';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  isEmpty: boolean;
  className?: string;
}

const ChartContainer: FC<ChartContainerProps> = ({ title, subtitle, children, isEmpty, className = "h-[400px]" }) => {
  return (
    <div className={`bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg flex flex-col ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="flex-grow w-full h-full relative">
        {isEmpty ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500">No data to display for the current selection.</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartContainer;
