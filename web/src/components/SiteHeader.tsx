import Link from "next/link";
export default function SiteHeader({active}:{active:"create"|"catalog"}) {
 return <header className="site-header"><div className="nav-inner">
  <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true">б.</span><span>Бизнесмен <strong>Ивентс</strong><small>БИЗНЕС + СТУДЕНТЫ</small></span></Link>
  <nav aria-label="Основная навигация"><Link href="/" aria-current={active==="create"?"page":undefined}>Для бизнеса</Link><Link href="/catalog" aria-current={active==="catalog"?"page":undefined}>Каталог задач <span aria-hidden="true">↗</span></Link></nav>
  <span className="nav-caption"><i /> Пространство совместных идей</span>
 </div></header>;
}
