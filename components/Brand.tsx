import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="HalkaArzım ana sayfa">
      <span className="brandMark" aria-hidden="true"><span /><span /><span /></span>
      <span>HalkaArzım</span>
      <small className="rcBadge">RC</small>
    </Link>
  );
}
