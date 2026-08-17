import React from 'react';

export const Table = ({ columns, data, loading, emptyMessage = 'No records found.' }) => {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-[#DDE3ED] bg-white">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-[#1E3A5F] text-white text-xs uppercase tracking-wider">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="px-4 py-3 font-semibold">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DDE3ED]">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-[#5A6A7E]">
                <div className="flex justify-center items-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-[#5A6A7E]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row._id || rowIndex} className="hover:bg-slate-50 transition-colors">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-4 py-3 text-[#1A2332]">
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
