import { useCallback, useEffect, useState } from 'react';
import { History, Search, Filter } from 'lucide-react';
import { reportApi } from '../api/reportApi';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { parsePage, formatDateTime } from '../utils/helpers';

export default function AuditLogPage() {
  const toast = useToast();

  const [pageData, setPageData] = useState({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 });
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState({ requestNo: '', actorName: '', action: '' });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 50 };
      if (filter.requestNo) params.requestNo = filter.requestNo;
      if (filter.actorName) params.actorName = filter.actorName;
      if (filter.action) params.action = filter.action;

      const { data } = await reportApi.getAuditLogReport(params);
      setPageData(parsePage(data));
    } catch {
      toast('Không thể tải nhật ký hệ thống', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filter, toast]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(0);
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-700/50">
            <History className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Nhật Ký Hệ Thống</h2>
            <p className="text-xs text-slate-400">Tra cứu toàn bộ lịch sử hành động (Audit Logs)</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleFilter} className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-700/50">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            value={filter.requestNo}
            onChange={e => setFilter({ ...filter, requestNo: e.target.value })}
            placeholder="Mã yêu cầu..."
            className="bg-transparent text-sm text-white focus:outline-none w-28"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-700/50">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            value={filter.actorName}
            onChange={e => setFilter({ ...filter, actorName: e.target.value })}
            placeholder="Người thực hiện..."
            className="bg-transparent text-sm text-white focus:outline-none w-32"
          />
        </div>

        <select
          value={filter.action}
          onChange={e => setFilter({ ...filter, action: e.target.value })}
          className="bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-700/50 text-sm text-white focus:outline-none cursor-pointer"
        >
          <option value="">Tất cả hành động</option>
          <option value="CREATED">CREATED</option>
          <option value="UPDATED">UPDATED</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="STEP_ADVANCED">STEP_ADVANCED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="RETURNED">RETURNED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="SYSTEM_TIMEOUT">SYSTEM_TIMEOUT</option>
        </select>

        <button type="submit" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
          <Filter className="w-4 h-4" /> Lọc
        </button>
      </form>

      {/* Log Table */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <Spinner />
        ) : pageData.content.length === 0 ? (
          <EmptyState icon={History} title="Không có bản ghi nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Thời gian</th>
                  <th className="text-left px-4 py-3">Hành động</th>
                  <th className="text-left px-4 py-3">Người thực hiện</th>
                  <th className="text-left px-4 py-3">Yêu cầu liên quan</th>
                  <th className="text-left px-4 py-3">Thay đổi trạng thái</th>
                  <th className="text-left px-4 py-3">Thay đổi bước</th>
                  <th className="text-left px-4 py-3">Chi tiết (JSON)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pageData.content.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-indigo-300">
                      ID: {log.actorId || 'Hệ thống'} <br />
                      <span className="text-slate-500">{log.actorEmail || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-semibold text-fuchsia-300">{log.requestNo || `ID: ${log.requestId}`}</div>
                      <div className="text-slate-400 text-[11px] truncate max-w-[180px]" title={log.requestTitle}>{log.requestTitle || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {log.oldStatus || log.newStatus ? (
                        <div className="flex items-center gap-1.5">
                          {log.oldStatus ? (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                              {log.oldStatus}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                          <span className="text-slate-500">→</span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-semibold font-mono">
                            {log.newStatus}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {log.stepFrom !== null || log.stepTo !== null ? (
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-slate-400">{log.stepFrom !== null ? `Bước ${log.stepFrom}` : '-'}</span>
                          <span className="text-slate-500">→</span>
                          <span className="text-indigo-300 font-semibold">{log.stepTo !== null ? `Bước ${log.stepTo}` : '-'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs md:max-w-md max-h-24 overflow-y-auto bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-400 border border-slate-800">
                        {log.details ? JSON.stringify(log.details) : '{}'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && pageData.totalPages > 1 && (
        <Pagination page={pageData.number} totalPages={pageData.totalPages} totalElements={pageData.totalElements} size={pageData.size} onPageChange={setPage} />
      )}
    </div>
  );
}
