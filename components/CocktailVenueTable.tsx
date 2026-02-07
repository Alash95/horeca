import { FC } from 'react';
import type { MenuItem } from '../types';

interface CocktailVenueTableProps {
  data: MenuItem[];
  cocktailName: string;
}

const CocktailVenueTable: FC<CocktailVenueTableProps> = ({ data, cocktailName }) => {

  if (data.length === 0) {
    return (
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg min-h-[300px] flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-gray-200 mb-2">Venue Breakdown for {cocktailName}</h3>
        <p className="text-gray-500">No venues found serving {cocktailName} with the current filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-200">Venue Breakdown for {cocktailName}</h3>
      </div>
      <div className="flex-grow overflow-auto max-h-96">
        <table className="min-w-full text-sm text-left">
          <thead className="sticky top-0 bg-gray-800">
            <tr className="border-b border-gray-700">
              <th scope="col" className="py-3 px-4 font-medium text-gray-300">Venue</th>
              <th scope="col" className="py-3 px-4 font-medium text-gray-300">Brand Used</th>
              <th scope="col" className="py-3 px-4 font-medium text-gray-300">City</th>
              <th scope="col" className="py-3 px-4 font-medium text-gray-300">Region</th>
              <th scope="col" className="py-3 px-4 font-medium text-gray-300 text-right">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.map(item => (
              <tr key={item["Menu ID"]} className="hover:bg-gray-700/ ৫০">
                <td className="py-3 px-4 font-medium text-gray-200 whitespace-nowrap">{item.insegna}</td>
                <td className="py-3 px-4 text-gray-300">{item.brand}</td>
                <td className="py-3 px-4 text-gray-300">{item.citta}</td>
                <td className="py-3 px-4 text-gray-300">{item.regione}</td>
                <td className="py-3 px-4 text-gray-300 text-right font-mono">€{item.prezzo.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CocktailVenueTable;