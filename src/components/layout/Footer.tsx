
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Camera,
  Users,
  PlayCircle,
  MessageCircle,
} from "lucide-react";

type StorePage = {
  slug: string;
  title: string;
  showInFooter?: boolean;
  footerGroup?: string;
};

type StoreConfig = {
  name?: string;
  paymentIcons?: string[];
  pages?: StorePage[];
  socialLinks?: Record<string, string>;
  social?: Record<string, string>;
  store?: {
    logoUrl?: string;
    tagline?: string;
    supportEmail?: string;
    supportPhone?: string;
    whatsappNumber?: string;
    address?: string;
    businessHours?: string;
    footerText?: string;
    socialLinks?: Record<string, string>;
  };
};

type FooterProps = {
  config: StoreConfig;
};

const paymentLabels: Record<string, string> = {
  UPI: "UPI",
  GPAY: "Google Pay",
  PHONEPE: "PhonePe",
  PAYTM: "Paytm",
  VISA: "Visa",
  MASTERCARD: "Mastercard",
  RUPAY: "RuPay",
  NETBANKING: "Net Banking",
  WALLETS: "Wallets",
  AMEX: "Amex",
  EMI: "EMI",
};

const socialIcons = [
  { key: "instagram", label: "Instagram", icon: Camera },
  { key: "facebook", label: "Facebook", icon: Users },
  { key: "youtube", label: "YouTube", icon: PlayCircle },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];

function getSocialUrl(
  key: string,
  config: StoreConfig
): string | undefined {
  const storeSocial = config.store?.socialLinks || {};
  const rootSocial = config.socialLinks || config.social || {};

  return (
    storeSocial[key] ||
    rootSocial[key] ||
    undefined
  );
}

function getWhatsAppUrl(number?: string) {
  if (!number) return undefined;

  const cleanNumber = number.replace(/\D/g, "");
  if (!cleanNumber) return undefined;

  return `https://wa.me/${cleanNumber}`;
}

export default function Footer({ config }: FooterProps) {
  const store = config.store || {};
  const storeName = config.name || "NOORINE";
  const logoUrl = store.logoUrl;

  const pages = (config.pages || []).filter(
    (page) => page.showInFooter !== false
  );

  const policyPages = pages.filter(
    (page) => page.footerGroup === "POLICIES"
  );

  const companyPages = pages.filter(
    (page) => page.footerGroup === "COMPANY"
  );

  const helpPages = pages.filter(
    (page) => page.footerGroup === "HELP"
  );

  const otherPages = pages.filter(
    (page) =>
      !["POLICIES", "COMPANY", "HELP"].includes(
        page.footerGroup || ""
      )
  );

  const paymentMethods = (config.paymentIcons || []).filter(
    (method) => method !== "COD" && paymentLabels[method]
  );

  const whatsappUrl = getWhatsAppUrl(store.whatsappNumber);

  return (
    <footer className="site-footer">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        {/* Main Footer */}
        <div className="grid grid-cols-1 gap-10 border-b border-white/15 pb-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div>
            <Link href="/" aria-label={`${storeName} home`}>
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={storeName}
                  width={180}
                  height={65}
                  unoptimized
                  className="mb-5 h-auto max-h-[55px] w-auto max-w-[170px] object-contain"
                />
              ) : (
                <h2 className="mb-5 font-serif text-3xl tracking-[0.12em] text-[#FAF6EF]">
                  {storeName}
                </h2>
              )}
            </Link>

            {store.tagline && (
              <p className="text-xs uppercase tracking-[0.2em] text-[#C9A24B]">
                {store.tagline}
              </p>
            )}

            {store.footerText && (
              <p className="mt-5 max-w-sm text-sm leading-7 text-white/65">
                {store.footerText}
              </p>
            )}
          </div>

          {/* Company Links */}
          <div>
            <h3 className="mb-5 text-sm uppercase tracking-[0.15em]">
              Company
            </h3>

            <ul className="space-y-3">
              {companyPages.map((page) => (
                <li key={page.slug}>
                  <Link
                    href={`/pages/${page.slug}`}
                    className="text-sm text-white/65 transition-colors hover:text-[#C9A24B]"
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help & Policies */}
          <div>
            <h3 className="mb-5 text-sm uppercase tracking-[0.15em]">
              Help & Policies
            </h3>

            <ul className="space-y-3">
              {[...helpPages, ...policyPages, ...otherPages].map(
                (page) => (
                  <li key={page.slug}>
                    <Link
                      href={`/pages/${page.slug}`}
                      className="text-sm text-white/65 transition-colors hover:text-[#C9A24B]"
                    >
                      {page.title}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-sm uppercase tracking-[0.15em]">
              Contact Us
            </h3>

            <ul className="space-y-4">
              {store.supportEmail && (
                <li className="flex items-start gap-3">
                  <Mail
                    size={17}
                    className="mt-1 shrink-0 text-[#C9A24B]"
                  />
                  <a
                    href={`mailto:${store.supportEmail}`}
                    className="break-all text-sm text-white/70 hover:text-[#C9A24B]"
                  >
                    {store.supportEmail}
                  </a>
                </li>
              )}

              {store.supportPhone && (
                <li className="flex items-start gap-3">
                  <Phone
                    size={17}
                    className="mt-1 shrink-0 text-[#C9A24B]"
                  />
                  <a
                    href={`tel:${store.supportPhone}`}
                    className="text-sm text-white/70 hover:text-[#C9A24B]"
                  >
                    {store.supportPhone}
                  </a>
                </li>
              )}

              {store.address && (
                <li className="flex items-start gap-3">
                  <MapPin
                    size={17}
                    className="mt-1 shrink-0 text-[#C9A24B]"
                  />
                  <span className="text-sm leading-6 text-white/70">
                    {store.address}
                  </span>
                </li>
              )}

              {store.businessHours && (
                <li className="flex items-start gap-3">
                  <Clock
                    size={17}
                    className="mt-1 shrink-0 text-[#C9A24B]"
                  />
                  <span className="text-sm text-white/70">
                    {store.businessHours}
                  </span>
                </li>
              )}

              {whatsappUrl && (
                <li>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 border border-[#C9A24B] px-4 py-2 text-xs uppercase tracking-wider text-[#C9A24B] transition-colors hover:bg-[#C9A24B] hover:text-[#2B2B2B]"
                  >
                    <MessageCircle size={16} />
                    Chat on WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Social & Payment Methods */}
        <div className="flex flex-col items-center justify-between gap-7 border-b border-white/15 py-8 md:flex-row">
          {/* Social Links */}
          <div className="flex flex-col items-center gap-4 md:items-start">
            <p className="text-xs uppercase tracking-[0.15em] text-white/70">
              Follow Us
            </p>

            <div className="flex items-center gap-4">
              {socialIcons.map(({ key, label, icon: Icon }) => {
                const url =
                  key === "whatsapp"
                    ? whatsappUrl
                    : getSocialUrl(key, config);

                if (!url) return null;

                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-[#C9A24B] hover:text-[#C9A24B]"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Payment Methods */}
          {paymentMethods.length > 0 && (
            <div className="flex flex-col items-center gap-3 md:items-end">
              <p className="text-xs uppercase tracking-[0.15em] text-white/70">
                We Accept
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
                {paymentMethods.map((method) => (
                  <span
                    key={method}
                    className="rounded-sm bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#2B2B2B]"
                  >
                    {paymentLabels[method]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-center md:flex-row md:text-left">
          <p className="text-xs leading-6 text-white/55">
            {store.footerText || `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`}
          </p>

          <Link
            href="/"
            className="text-xs uppercase tracking-[0.15em] text-[#C9A24B] hover:text-white"
          >
            {storeName}
          </Link>
        </div>
      </div>
    </footer>
  );
}
