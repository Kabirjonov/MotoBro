import { PageMotion } from "@/components/motion/reveal";
import { PublicFooter } from "@/components/shared/public-footer";
import { PublicHeader } from "@/components/shared/public-header";
import { StoreContactWidget } from "@/features/storefront/contact-widget";

export default function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <PageMotion>{children}</PageMotion>
      </main>
      <PublicFooter />
      <StoreContactWidget />
    </div>
  );
}
