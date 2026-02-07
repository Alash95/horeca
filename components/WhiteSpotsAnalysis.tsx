import { FC } from 'react';

interface WhiteSpotsAnalysisProps {
  data: {
    location: string;
    competitors: string[];
  }[];
}

const WhiteSpotsAnalysis: FC<WhiteSpotsAnalysisProps> = ({ data }) => {
  const title = "White Spots Analysis (Growth Opportunities)";
  const subtitle = "Locations where you are absent, but key competitors are present.";

  if (data.length === 0) {
    return (
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg h-full flex flex-col items-center justify-center text-center">
        <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm">No significant white spots found for the current selection. <br /> Your distribution is strong against top competitors.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      </div>
      <div className="flex-grow overflow-auto max-h-80">
        <table className="min-w-full text-sm text-left">
          <thead className="sticky top-0 bg-gray-800 z-10">
            <tr className="border-b border-gray-700">
              <th scope="col" className="py-3 px-4 font-medium text-gray-300">Location (Region - Type)</th>
              <th scope="col" className="py-3 px-4 font-medium text-gray-300">Competitors Present</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.map(({ location, competitors }) => (
              <tr key={location} className="hover:bg-gray-700/50">
                <td className="py-3 px-4 font-medium text-gray-200 whitespace-nowrap">{location}</td>
                <td className="py-3 px-4 text-gray-300">
                  <div className="flex flex-wrap gap-1">
                    {competitors.map(c => (
                      <span key={c} className="bg-gray-700 text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WhiteSpotsAnalysis;
