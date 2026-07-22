import Link from "next/link";
import { ArrowLeft, RotateCcw, ShieldCheck, RefreshCw, Phone, Mail, MapPin, BadgeCheck } from "lucide-react";

export default function PolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-gray-950 py-12 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 md:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> العودة للمتجر
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">سياسة الاستبدال والاسترجاع</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">جميع التفاصيل الخاصة بالاستبدال والاسترجاع وملف Refund Policy</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white">الاستبدال</h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <li>• يتم قبول الاستبدال خلال 7 أيام من تاريخ استلام الطلب.</li>
              <li>• يجب أن يكون المنتج بحالته الأصلية وغير مستخدم.</li>
              <li>• في حالة وجود عيب صناعي أو منتج خاطئ يتم الاستبدال مجاناً.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white">الاسترجاع</h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <li>• يتم استرجاع المبلغ خلال 3-7 أيام عمل بعد تأكيد الاسترجاع.</li>
              <li>• يتم استرجاع المبلغ بنفس طريقة الدفع المستخدمة.</li>
              <li>• لا يتم قبول الاسترجاع في حالة استخدام المنتج أو فقد العبوة الأصلية.</li>
            </ul>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/70 dark:bg-indigo-950/20 p-6">
          <div className="flex items-center gap-2 mb-3">
            <BadgeCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Refund Policy</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            إذا كان هناك مشكلة في المنتج أو تأخر في التوصيل أو تم استلام منتج غير مطابق للطلب، يرجى التواصل معنا فوراً وسنقوم بدراسة الطلب وتقديم الحل المناسب. يتم إصدار الرصيد أو الاسترداد بعد مراجعة الطلب من خلال فريق الدعم.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">بيانات التواصل</h2>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-indigo-600" /> <span>01286622370</span></div>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-600" /> <span>ziad89067@gmail.com</span></div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-600" /> <span>الإسكندرية - المنتزه العصافرة ش30 الجديد</span></div>
          </div>
        </section>
      </div>
    </main>
  );
}
