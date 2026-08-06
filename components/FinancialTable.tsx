import type { Ipo } from "@/data/ipos";

export function FinancialTable({ rows }: { rows: Ipo["financials"] }) {
  if (!rows.length) return <div className="chartEmpty"><strong>Finansal tablolar henüz işlenmedi.</strong><p>İzahname ve bağımsız denetim raporu doğrulandığında bu bölüm otomatik güncellenecek.</p></div>;
  return (
    <div className="tableWrap"><table className="financialTable"><thead><tr><th>Dönem</th><th>Hasılat</th><th>Net kâr</th><th>Finansal borç</th></tr></thead><tbody>{rows.map((row) => <tr key={row.period}><td>{row.period}</td><td>{row.revenue.toLocaleString("tr-TR")} mn ₺</td><td>{row.netProfit.toLocaleString("tr-TR")} mn ₺</td><td>{row.debt == null ? "Belgede ayrıştırılmadı" : `${row.debt.toLocaleString("tr-TR")} mn ₺`}</td></tr>)}</tbody></table></div>
  );
}
