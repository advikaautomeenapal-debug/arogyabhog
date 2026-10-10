import React from 'react';

/**
 * Floating WhatsApp Button for Arogya Bhog Customer Storefront
 * Direct link: https://wa.me/c/919621496772
 * Positioned in bottom-right corner, comfortably above bottom navigation bar on mobile
 */
export function WhatsAppButton() {
  return (
    <aside
      aria-label="Customer Support WhatsApp"
      className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 md:bottom-8 md:right-8 z-40 print:hidden"
    >
      <a
        href="https://wa.me/c/919621496772"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Arogya Bhog on WhatsApp"
        className="group relative flex items-center gap-2.5 px-3.5 py-3 md:px-4 md:py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
      >
        {/* Pulsing subtle ambient halo */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/30 animate-ping opacity-40 pointer-events-none" />

        {/* Official WhatsApp SVG Icon */}
        <svg
          className="w-6 h-6 md:w-7 md:h-7 fill-current relative z-10"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.275-.1-.476-.15-.677.15-.201.3-.778.978-.954 1.179-.176.2-.351.226-.652.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.676-2.085-.176-.3-.019-.462.132-.612.136-.135.301-.351.452-.527.15-.175.201-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.631-.928-2.233-.244-.586-.492-.507-.677-.516-.175-.009-.376-.01-.576-.01-.201 0-.527.075-.803.376s-1.053 1.028-1.053 2.508 1.079 2.909 1.229 3.11c.15.201 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.634.721.229 1.377.197 1.895.12.578-.087 1.78-.727 2.031-1.429.251-.702.251-1.303.176-1.429-.076-.125-.276-.201-.577-.351zM12.04 21.78c-1.748 0-3.46-.464-4.97-1.344l-.356-.211-3.696.97.986-3.602-.232-.369A9.73 9.73 0 0 1 2.27 12.04c0-5.385 4.383-9.768 9.77-9.768 2.61 0 5.064 1.018 6.91 2.864a9.714 9.714 0 0 1 2.862 6.907c0 5.386-4.383 9.769-9.772 9.769zm8.307-18.077A11.666 11.666 0 0 0 12.04 0C5.401 0 0 5.401 0 12.04c0 2.12.553 4.188 1.604 6.008L0 24l6.126-1.606a11.64 11.64 0 0 0 5.914 1.586h.005c6.637 0 12.038-5.401 12.038-12.04 0-3.216-1.252-6.24-3.528-8.516z" />
        </svg>

        {/* Text Pill (visible on desktop, or hover) */}
        <span className="hidden sm:inline font-sans font-semibold text-xs tracking-wide">
          Order on WhatsApp
        </span>
      </a>
    </aside>
  );
}
export default WhatsAppButton;
