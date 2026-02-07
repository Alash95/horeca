import { FC } from 'react';

const MetricFormulasTable: FC = () => {
  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Metric Calculation Formulas</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="border-b border-gray-700">
            <tr>
              <th scope="col" className="py-2 px-3 font-medium text-gray-300">Metric</th>
              <th scope="col" className="py-2 px-3 font-medium text-gray-300">Formula</th>
              <th scope="col" className="py-2 px-3 font-medium text-gray-300">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            <tr className="hover:bg-gray-700/50">
              <td className="py-3 px-3 font-bold text-gray-200 align-top">Hero Brand Dependency</td>
              <td className="py-3 px-3 text-gray-300 font-mono align-top">(&#123;Listings of Hero Brand&#125; / &#123;Total Listings of Brand Owner&#125;) * 100</td>
              <td className="py-3 px-3 text-gray-400 align-top">Measures the percentage of a Brand Owner's presence that comes from its single best-performing brand.</td>
            </tr>
            <tr className="hover:bg-gray-700/50">
              <td className="py-3 px-3 font-bold text-gray-200 align-top">Distribution Depth</td>
              <td className="py-3 px-3 text-gray-300 font-mono align-top">&#123;Total Listings of Brand Owner&#125; / &#123;# of Unique Venues&#125;</td>
              <td className="py-3 px-3 text-gray-400 align-top">Calculates the average number of products (or listings) a Brand Owner has in each venue where they are present.</td>
            </tr>
            <tr className="hover:bg-gray-700/50">
              <td className="py-3 px-3 font-bold text-gray-200 align-top">Channel Penetration</td>
              <td className="py-3 px-3 text-gray-300 font-mono align-top">(&#123;# of Venues with Brand Owner&#125; / &#123;Total # of Venues in Channel&#125;) * 100</td>
              <td className="py-3 px-3 text-gray-400 align-top">Measures the percentage of all venues in a specific channel (e.g., Bar) where the Brand Owner is present with at least one product.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MetricFormulasTable;
