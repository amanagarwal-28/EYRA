import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Breadcrumb, title, and standfirst shared by every editorial and legal page,
 * matching the header treatment already used on the products listing.
 */
export function PageHeader({
  title,
  standfirst,
  crumbs = [],
  eyebrow,
}: {
  title: string;
  standfirst?: string;
  crumbs?: Crumb[];
  eyebrow?: string;
}) {
  return (
    <div className="max-w-screen-xl mx-auto px-6 lg:px-10 pt-10">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-sans font-normal text-[16px] leading-[24px] mb-8 flex-wrap"
      >
        <Link href="/" className="text-[#909090] hover:text-black transition-colors duration-200">
          Home
        </Link>
        {crumbs.map((crumb) => (
          <span key={crumb.label} className="flex items-center gap-1">
            <span className="text-[#909090]">/</span>
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-[#909090] hover:text-black transition-colors duration-200"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-black">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="max-w-[640px]">
        {eyebrow && (
          <p className="font-sans font-normal text-[0.7rem] tracking-[0.28em] uppercase text-[#909090] mb-4">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display font-light italic text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.1] text-black">
          {title}
        </h1>
        {standfirst && (
          <p className="font-sans font-light text-[18px] leading-[27px] text-[#505050] mt-4">
            {standfirst}
          </p>
        )}
      </div>
    </div>
  );
}
