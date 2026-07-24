import React, { useState, useEffect } from 'react';
import { Award, Plus, Edit2, Trash2, X, Save, AlertCircle, Loader2, Users, Trophy } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { adminApi } from '../../api/adminApi';

/**
 * Admin screen to manage Chapters (create / edit / delete) and see the year-long
 * Chapter Leaderboard standings side by side.
 * Scoring rule: champion +20, runner-up +15, third +10 per event; equal totals share a rank.
 */
const ChapterManagement = () => {
  const [chapters, setChapters] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Create / Edit modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null); // null = create mode
  const [form, setForm] = useState({ name: '', bonusPoint: 0 });
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [list, board] = await Promise.all([
        adminApi.getChapters(),
        adminApi.getChapterLeaderboard(),
      ]);
      setChapters(list);
      setLeaderboard(board);
    } catch (err) {
      console.error('Failed to load chapters', err);
      showToast('Không tải được danh sách chapter', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Merge leaderboard stats (rank / total points / team count) into each chapter row.
  const statsById = leaderboard.reduce((acc, e) => { acc[e.chapterId] = e; return acc; }, {});

  const openCreate = () => {
    setEditingChapter(null);
    setForm({ name: '', bonusPoint: 0 });
    setError('');
    setShowFormModal(true);
  };

  const openEdit = (chapter) => {
    setEditingChapter(chapter);
    setForm({ name: chapter.name || '', bonusPoint: chapter.bonusPoint ?? 0 });
    setError('');
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingChapter(null);
    setError('');
  };

  const triggerError = (msg) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    const name = form.name.trim();
    if (!name) return triggerError('Tên chapter không được để trống.');
    if (name.length > 150) return triggerError('Tên chapter tối đa 150 ký tự.');

    const bonusRaw = String(form.bonusPoint ?? '').trim();
    if (bonusRaw !== '' && !/^-?\d+$/.test(bonusRaw)) {
      return triggerError('Điểm thưởng/phạt phải là số nguyên (có thể âm).');
    }
    const bonusPoint = bonusRaw === '' ? 0 : parseInt(bonusRaw, 10);

    // Duplicate name guard (client-side, case-insensitive)
    const dup = chapters.some(c =>
      c.name?.trim().toLowerCase() === name.toLowerCase() && c.id !== editingChapter?.id);
    if (dup) return triggerError('Đã tồn tại chapter trùng tên.');

    setIsSaving(true);
    try {
      if (editingChapter) {
        await adminApi.updateChapter(editingChapter.id, { name, bonusPoint });
        showToast(`Đã cập nhật chapter "${name}"`);
      } else {
        await adminApi.createChapter({ name, bonusPoint });
        showToast(`Đã tạo chapter "${name}"`);
      }
      closeFormModal();
      loadData();
    } catch (err) {
      triggerError(err.response?.data?.message || err.message || 'Lưu chapter thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await adminApi.deleteChapter(target.id);
      showToast(`Đã xoá chapter "${target.name}"`);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Xoá chapter thất bại', 'error');
    }
  };

  const rankBadge = (rank) => {
    if (!rank) return null;
    const map = { 1: { icon: '🥇', color: '#B8860B' }, 2: { icon: '🥈', color: '#707070' }, 3: { icon: '🥉', color: '#8B4513' } };
    const m = map[rank];
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '700', color: m ? m.color : 'var(--text-secondary)' }}>
        {m ? m.icon : ''} #{rank}
      </span>
    );
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '30px', marginBottom: '6px' }}>Chapter Management</h1>
            <p className="subtitle" style={{ margin: 0 }}>
              Quản lý các Chapter và điểm thưởng/phạt. Bảng xếp hạng tích luỹ xuyên suốt năm.
            </p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> Create Chapter</button>
        </div>
      </div>

      {/* Scoring rule note */}
      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginBottom: '20px', padding: '14px 18px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <span><Trophy size={14} style={{ verticalAlign: '-2px' }} /> Quy tắc điểm:</span>
        <span>🥇 Vô địch <strong style={{ color: 'var(--text-primary)' }}>+20</strong></span>
        <span>🥈 Á quân <strong style={{ color: 'var(--text-primary)' }}>+15</strong></span>
        <span>🥉 Hạng ba <strong style={{ color: 'var(--text-primary)' }}>+10</strong></span>
        <span>· Điểm thưởng/phạt thủ công cộng thêm vào tổng</span>
        <span>· Bằng điểm thì <strong style={{ color: 'var(--text-primary)' }}>cùng hạng</strong></span>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chapter</th>
              <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hạng</th>
              <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tổng điểm</th>
              <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thưởng/phạt</th>
              <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đội có thành tích</th>
              <th style={{ padding: '14px 24px', textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px', display: 'block' }} />Đang tải…
              </td></tr>
            ) : chapters.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Award size={36} style={{ marginBottom: '10px' }} />
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Chưa có chapter nào</div>
                <div style={{ fontSize: '13px' }}>Bấm “Create Chapter” để tạo chapter đầu tiên.</div>
              </td></tr>
            ) : chapters.map((c) => {
              const st = statsById[c.id];
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,var(--primary),#1F4E79)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Award size={19} color="#fff" />
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '15px' }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>{rankBadge(st?.rank)}</td>
                  <td style={{ padding: '16px 24px', fontWeight: '700', fontSize: '16px' }}>{st?.totalPoints ?? 0}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: (c.bonusPoint ?? 0) < 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                    {(c.bonusPoint ?? 0) > 0 ? `+${c.bonusPoint}` : (c.bonusPoint ?? 0)}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Users size={13} style={{ verticalAlign: '-2px' }} /> {st?.teamCount ?? 0}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(c)} title="Sửa chapter"
                        style={{ padding: '7px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(c)} title="Xoá chapter"
                        style={{ padding: '7px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: 'var(--danger)', cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Create / Edit Modal ─────────────────────────────────────────── */}
      {showFormModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={closeFormModal} />
          <div className={`animate-fade-in ${shaking ? 'shake' : ''}`}
            style={{ position: 'relative', width: '90%', maxWidth: '460px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '28px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
            <button className="btn-icon" onClick={closeFormModal}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--bg-subtle)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'linear-gradient(135deg,var(--primary),#1F4E79)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={23} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: '19px', marginBottom: '2px' }}>{editingChapter ? 'Sửa Chapter' : 'Tạo Chapter mới'}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  {editingChapter ? 'Cập nhật tên hoặc điểm thưởng/phạt.' : 'Chapter dùng cho bảng xếp hạng xuyên suốt năm.'}
                </p>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '18px' }}>
                <AlertCircle size={17} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '18px' }}>
                <label htmlFor="chapterName" style={{ display: 'block', marginBottom: '7px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Tên Chapter <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input id="chapterName" type="text" value={form.name} autoFocus
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: FPT Hồ Chí Minh"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: '#FFFFFF', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label htmlFor="chapterBonus" style={{ display: 'block', marginBottom: '7px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Điểm thưởng / phạt thủ công
                </label>
                <input id="chapterBonus" type="number" value={form.bonusPoint}
                  onChange={(e) => setForm({ ...form, bonusPoint: e.target.value })}
                  placeholder="0"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: '#FFFFFF', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }} />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                  Cộng thêm vào tổng điểm của chapter (số âm để trừ điểm theo quy định). Điểm thành tích 20/15/10 được hệ thống tự cộng.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={closeFormModal}
                  style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer' }}>
                  Huỷ
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}
                  style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>
                  {isSaving ? 'Đang lưu…' : <><Save size={16} /> {editingChapter ? 'Lưu thay đổi' : 'Tạo Chapter'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ───────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        type="danger"
        title="Xoá Chapter?"
        confirmText="Xoá Chapter"
        cancelText="Huỷ"
        message={deleteTarget
          ? `Chapter "${deleteTarget.name}" sẽ bị xoá khỏi bảng xếp hạng. Các đội đang thuộc chapter này sẽ không còn đóng góp điểm. Hành động này không thể hoàn tác.`
          : ''}
      />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 200,
          padding: '13px 20px', borderRadius: '12px', color: '#fff', fontWeight: '600', fontSize: '14px',
          background: toast.type === 'error' ? 'var(--danger, #ef4444)' : 'var(--success, #10b981)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.18)'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ChapterManagement;
