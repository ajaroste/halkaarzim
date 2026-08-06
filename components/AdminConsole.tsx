"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { ipos } from "@/data/ipos";
import { useAuth } from "./AuthProvider";
import {
  adminAddDocument,
  adminPatchIpo,
  isSupabaseConfigured,
  listModerationQueue,
  moderateQueuedComment
} from "@/lib/supabase-rest";

type QueueItem = { id: string; ipo_id: string; body: string; created_at: string; user_id: string };
const dbStatuses = [
  ["approved", "SPK onaylı"], ["collecting", "Talep topluyor"], ["listing_pending", "Arz tamamlandı"],
  ["listed", "İşlem görüyor"], ["cancelled", "Ertelendi/iptal"], ["draft", "Taslak"]
] as const;

export function AdminConsole() {
  const { session, profile, loading } = useAuth();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [ipoId, setIpoId] = useState(ipos[0]?.id || "");
  const [status, setStatus] = useState("");
  const [ticker, setTicker] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [trade, setTrade] = useState("");
  const [intermediary, setIntermediary] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("prospectus");
  const [docKind, setDocKind] = useState("kap");
  const [docUrl, setDocUrl] = useState("");
  const allowed = profile?.role === "admin" || profile?.role === "moderator";
  const admin = profile?.role === "admin";

  async function load() {
    if (!session || !allowed) return;
    try { setQueue((await listModerationQueue(session.access_token)) as unknown as QueueItem[]); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Kuyruk alınamadı."); }
  }
  useEffect(() => { void load(); }, [session, allowed]);

  async function act(id: string, action: "publish" | "hide") {
    if (!session) return; setBusy(id);
    try {
      await moderateQueuedComment(id, action, session.access_token);
      setQueue((items) => items.filter((item) => item.id !== id));
      setMessage(action === "publish" ? "Yorum yayımlandı." : "Yorum gizlendi.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Moderasyon işlemi başarısız."); }
    finally { setBusy(null); }
  }

  async function saveIpo() {
    if (!session || !admin) return; setBusy("ipo");
    try {
      await adminPatchIpo({ ipoId, status, ticker, collectionStart: start, collectionEnd: end, firstTradeDate: trade, intermediary }, session.access_token);
      setMessage("Canlı veritabanındaki halka arz kaydı güncellendi ve audit log oluşturuldu.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Halka arz güncellenemedi."); }
    finally { setBusy(null); }
  }

  async function addDocument() {
    if (!session || !admin) return; setBusy("document");
    try {
      await adminAddDocument({ ipoId, title: docTitle, documentType: docType, sourceKind: docKind, sourceUrl: docUrl }, session.access_token);
      setDocTitle(""); setDocUrl(""); setMessage("Belge inceleme kuyruğuna eklendi.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Belge eklenemedi."); }
    finally { setBusy(null); }
  }

  if (!isSupabaseConfigured()) return <article className="panel"><h2>Canlı yönetim bağlantısı</h2><p>Supabase ortam değişkenleri eklenince moderasyon ve veri düzeltme araçları burada çalışır.</p></article>;
  if (loading) return <article className="panel"><p>Yetki kontrol ediliyor…</p></article>;
  if (!session) return <article className="panel"><h2>Yönetici girişi gerekli</h2><p>Bu işlemler yalnız doğrulanmış moderatör veya yönetici hesabına açıktır.</p></article>;
  if (!allowed) return <article className="panel"><h2>Yetki yok</h2><p>Hesabın moderasyon yetkisine sahip değil.</p></article>;

  return <div className="adminStack">
    {message && <p className="formMessage" role="status">{message}</p>}
    <article className="panel adminQueue"><div className="panelHeader"><div><span className="eyebrow">Gerçek işlem</span><h2>Yorum moderasyon kuyruğu</h2></div><button className="secondaryButton small" onClick={() => void load()}>Yenile</button></div>
      {queue.length ? queue.map((item) => <div className="queueItem" key={item.id}><div className="avatar">?</div><div><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString("tr-TR")}</small></div><div className="buttonRow"><button className="primaryButton" disabled={busy === item.id} onClick={() => void act(item.id, "publish")}>Yayımla</button><button className="secondaryButton" disabled={busy === item.id} onClick={() => void act(item.id, "hide")}>Gizle</button></div></div>) : <div className="emptyState"><strong>Kuyruk boş</strong><p>İncelenecek yorum bulunmuyor.</p></div>}
    </article>

    {admin && <article className="panel"><div className="panelHeader"><div><span className="eyebrow">Audit kayıtlı</span><h2>Halka arz düzeltme</h2></div></div>
      <div className="adminFormGrid">
        <label>Şirket<select value={ipoId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setIpoId(e.target.value)}>{ipos.map((ipo) => <option key={ipo.id} value={ipo.id}>{ipo.ticker || "—"} · {ipo.company}</option>)}</select></label>
        <label>Durum<select value={status} onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}><option value="">Değiştirme</option>{dbStatuses.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Borsa kodu<input value={ticker} onChange={(e: ChangeEvent<HTMLInputElement>) => setTicker(e.target.value.toUpperCase())} maxLength={10} placeholder="Örn. ABCDE" /></label>
        <label>Talep başlangıcı<input type="date" value={start} onChange={(e: ChangeEvent<HTMLInputElement>) => setStart(e.target.value)} /></label>
        <label>Talep bitişi<input type="date" value={end} onChange={(e: ChangeEvent<HTMLInputElement>) => setEnd(e.target.value)} /></label>
        <label>İlk işlem günü<input type="date" value={trade} onChange={(e: ChangeEvent<HTMLInputElement>) => setTrade(e.target.value)} /></label>
        <label className="wideField">Aracı kurum<input value={intermediary} onChange={(e: ChangeEvent<HTMLInputElement>) => setIntermediary(e.target.value)} maxLength={160} /></label>
      </div><button className="primaryButton" disabled={busy === "ipo"} onClick={() => void saveIpo()}>Düzeltmeyi kaydet</button>
    </article>}

    {admin && <article className="panel"><div className="panelHeader"><div><span className="eyebrow">Kaynak zorunlu</span><h2>Belge ekle</h2></div></div>
      <div className="adminFormGrid">
        <label className="wideField">Belge başlığı<input value={docTitle} onChange={(e: ChangeEvent<HTMLInputElement>) => setDocTitle(e.target.value)} maxLength={200} /></label>
        <label>Belge türü<select value={docType} onChange={(e: ChangeEvent<HTMLSelectElement>) => setDocType(e.target.value)}><option value="prospectus">İzahname</option><option value="price_determination">Fiyat tespit raporu</option><option value="fund_use">Fon kullanım raporu</option><option value="financial_report">Finansal rapor</option><option value="kap_disclosure">KAP açıklaması</option></select></label>
        <label>Kaynak<select value={docKind} onChange={(e: ChangeEvent<HTMLSelectElement>) => setDocKind(e.target.value)}><option value="kap">KAP</option><option value="spk">SPK</option><option value="company">Şirket</option><option value="other">Diğer</option></select></label>
        <label className="wideField">HTTPS bağlantısı<input type="url" value={docUrl} onChange={(e: ChangeEvent<HTMLInputElement>) => setDocUrl(e.target.value)} placeholder="https://..." /></label>
      </div><button className="primaryButton" disabled={busy === "document" || !docTitle || !docUrl} onClick={() => void addDocument()}>Belgeyi kuyruğa ekle</button>
    </article>}
  </div>;
}
