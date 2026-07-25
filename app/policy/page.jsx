import Link from "next/link";
import { ArrowLeft, RotateCcw, ShieldCheck, RefreshCw, BadgeCheck } from "lucide-react";

export default function PolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 md:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Return & Refund Policy</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">All details related to exchanges, returns, and our refund policy.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Exchange Policy</h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <li>• Exchanges are accepted within 7 days of receiving your order.</li>
              <li>• The product must be in its original condition and unused.</li>
              <li>• In case of a manufacturing defect or incorrect item, exchange is free of charge.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Return Policy</h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <li>• Refunds are processed within 3–7 business days after the return is confirmed.</li>
              <li>• The refund will be issued using the same payment method used at checkout.</li>
              <li>• Returns are not accepted if the product has been used or the original packaging is missing.</li>
            </ul>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/70 dark:bg-indigo-950/20 p-6">
          <div className="flex items-center gap-2 mb-3">
            <BadgeCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Refund Policy</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            If there is an issue with a product, a delayed delivery, or if you received an incorrect item, please contact us immediately. Our support team will review your request and provide the appropriate solution. Refunds or store credits are issued after case review.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2">Contact Support</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">For any inquiries or return requests, please reach out via the contact form on our website or through our support email configured in your store settings.</p>
        </section>
      </div>
    </main>
  );
}
