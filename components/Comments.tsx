"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { moderateComment } from "@/lib/domain";
import { createComment, isSupabaseConfigured, listComments, reportComment, voteComment } from "@/lib/supabase-rest";
import { useAuth } from "./AuthProvider";

export type DisplayComment = { id: string; name: string; time: string; text: string; likes: number };
export function Comments({ ipoId }: { ipoId: string; slug: string }) {
  const [comments, setComments] = useState<DisplayComment[]>([]); const [draft, setDraft] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(true); const [busyId, setBusyId] = useState<string | null>(null);
  const { session } = useAuth(); const remaining = useMemo(() => 500 - draft.length, [draft]);
  async function load() {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    try {
      const rows = await listComments(ipoId, session?.access_token);
      setComments(rows.map((row) => ({ id: String(row.id), name: String(row.display_name || "Üye"), time: new Date(String(row.created_at)).toLocaleString("tr-TR"), text: String(row.body), likes: Number(row.helpful_count || 0) })));
    } catch { setMessage("Yorumlar şu anda alınamadı."); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [ipoId, session]);
  async function submitComment() {
    const result = moderateComment(draft); if (!result.allowed) { setMessage(result.reason || "Yorum yayımlanamadı."); return; }
    if (!session) { setMessage("Yorum yapmak için giriş yapmalısın."); return; }
    try {
      await createComment({ ipoId, body: draft.trim(), token: session.access_token });
      setDraft("");
      setMessage("Yorumun yayımlandı.");
      await load();
    }
    catch (error) { setMessage(error instanceof Error ? error.message : "Yorum kaydedilemedi."); }
  }
  async function vote(id: string) {
    if (!session) { setMessage("Faydalı oyu için giriş yapmalısın."); return; } setBusyId(id);
    try { await voteComment(id, session.access_token); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : "Oy kaydedilemedi."); } finally { setBusyId(null); }
  }
  async function report(id: string) {
    if (!session) { setMessage("Yorumu bildirmek için giriş yapmalısın."); return; }
    const details = window.prompt("Bildirim nedenini kısaca yaz (isteğe bağlı):", "") || ""; setBusyId(id);
    try { await reportComment(id, "other", details, session.access_token); setMessage("Bildirim moderasyon ekibine iletildi."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Bildirim gönderilemedi."); } finally { setBusyId(null); }
  }
  return <section className="commentsPanel" id="yorumlar"><div className="sectionHeading compactHeading"><div><span className="eyebrow">Topluluk</span><h2>Yatırımcı yorumları</h2></div><span className="commentCount">{comments.length} yorum</span></div>
    <div className="commentComposer"><textarea maxLength={500} value={draft} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { setDraft(e.target.value); setMessage(""); }} placeholder="Görüşünü paylaş…" aria-label="Yorum" disabled={!isSupabaseConfigured()} /><div className="composerFooter"><small>{remaining} karakter</small><button className="primaryButton" onClick={() => void submitComment()} disabled={!isSupabaseConfigured() || !draft.trim()}>Yorum yap</button></div></div>
    <div className="commentNotices"><p className="moderationNote"><strong>Yorumlar kullanıcı görüşüdür.</strong> HalkaArzım görüşü veya yatırım tavsiyesi değildir; içerikten yorumu paylaşan kullanıcı sorumludur. Kötüye kullanım ve hukuki talepler için sınırlı teknik erişim kayıtları tutulabilir.</p><p className="moderationNote">Kesin kazanç vaadi, organize alım çağrısı, iletişim grubu reklamı, kişisel veri ve hakaret otomatik olarak engellenir. Bildirilen içerikler sonradan incelenebilir.</p></div>{!isSupabaseConfigured() && <p className="formMessage">Yorum alanı şu anda salt okunur.</p>}{message && <p className="formMessage" role="status">{message}</p>}
    {loading ? <p>Yorumlar yükleniyor…</p> : <div className="commentList">{comments.map((comment) => <article className="comment" key={comment.id}><div className="avatar">{comment.name.charAt(0).toUpperCase()}</div><div><div className="commentMeta"><strong>{comment.name}</strong><span>{comment.time}</span></div><p>{comment.text}</p><div className="commentActions"><button className="textButton" disabled={busyId === comment.id} onClick={() => void vote(comment.id)}>Faydalı · {comment.likes}</button><button className="textButton dangerText" disabled={busyId === comment.id} onClick={() => void report(comment.id)}>Bildir</button></div></div></article>)}{!comments.length && <div className="emptyState"><strong>Henüz yorum yok</strong><p>İlk görüşü sen paylaşabilirsin.</p></div>}</div>}
  </section>;
}
