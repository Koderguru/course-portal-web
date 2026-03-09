"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X, Clock } from "lucide-react";

// Site deactivation date — 20 days from 9 March 2026
const DEACTIVATION_DATE = new Date("2026-03-29T23:59:59");

function getDaysLeft(): number {
  const now = new Date();
  const diff = DEACTIVATION_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getTimeLeft() {
  const now = new Date();
  const diff = Math.max(0, DEACTIVATION_DATE.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

export function DeactivationCountdown() {
  const [showPopup, setShowPopup] = useState(false);
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Show popup once per day (stored in localStorage)
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem("deactivation_popup_shown");
    if (lastShown !== today) {
      setShowPopup(true);
      localStorage.setItem("deactivation_popup_shown", today);
    }

    // Live countdown timer — updates every second
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const daysLeft = timeLeft.days;
  const isUrgent = daysLeft <= 5;
  const isCritical = daysLeft <= 2;

  return (
    <>
      {/* ───── Corner Badge (always visible) ───── */}
      <div
        className={`fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-[9999] flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl shadow-2xl border backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-105 select-none ${
          isCritical
            ? "bg-red-600/95 border-red-400 text-white"
            : isUrgent
            ? "bg-orange-500/95 border-orange-400 text-white"
            : "bg-slate-900/90 border-slate-700 text-white dark:bg-white/10 dark:border-white/20"
        }`}
        onClick={() => setShowPopup(true)}
        title="Site deactivation countdown"
      >
        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
        <div className="flex items-baseline gap-1 sm:gap-1.5">
          <span className="text-xl sm:text-2xl font-extrabold tabular-nums leading-none">
            {daysLeft}
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium opacity-80 leading-none">
            {daysLeft === 1 ? "day" : "days"} left
          </span>
        </div>
      </div>

      {/* ───── Popup Modal ───── */}
      {showPopup && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setShowPopup(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md animate-[slideUp_0.3s_ease-out] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl">
            {/* Top warning strip */}
            <div
              className={`px-6 py-3 flex items-center gap-2 text-white text-sm font-semibold ${
                isCritical
                  ? "bg-red-600"
                  : isUrgent
                  ? "bg-orange-500"
                  : "bg-gradient-to-r from-amber-500 to-orange-500"
              }`}
            >
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Site Deactivation Warning</span>
              <button
                className="ml-auto p-0.5 rounded-full hover:bg-white/20 transition"
                onClick={() => setShowPopup(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="bg-white dark:bg-slate-900 px-4 py-5 sm:px-6 sm:py-6">
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-3">
                There are chances that this site may get <strong className="text-red-600 dark:text-red-400">deactivated</strong> due to a possible copyright claim from <strong>Apna College</strong>. Nothing is confirmed yet, but as a precaution we might have to take it down around{" "}
                <strong>
                  {DEACTIVATION_DATE.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>.
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-5 italic">
                ⚠️ We respect content creators and their rights. Please save any important data just in case.
              </p>

              {/* Countdown boxes */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-5">
                {[
                  { label: "Days", value: timeLeft.days },
                  { label: "Hours", value: timeLeft.hours },
                  { label: "Minutes", value: timeLeft.minutes },
                  { label: "Seconds", value: timeLeft.seconds },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex flex-col items-center py-2 sm:py-3 rounded-lg sm:rounded-xl border ${
                      isCritical
                        ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                        : isUrgent
                        ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <span
                      className={`text-lg sm:text-2xl font-extrabold tabular-nums ${
                        isCritical
                          ? "text-red-600 dark:text-red-400"
                          : isUrgent
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {String(item.value).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isCritical
                      ? "bg-red-500"
                      : isUrgent
                      ? "bg-orange-500"
                      : "bg-gradient-to-r from-amber-400 to-orange-500"
                  }`}
                  style={{ width: `${Math.max(0, 100 - (daysLeft / 20) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
                {daysLeft > 0
                  ? `${daysLeft} of 20 days remaining`
                  : "Site deactivation period has ended"}
              </p>

              {/* Close button */}
              <button
                onClick={() => setShowPopup(false)}
                className={`mt-5 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 ${
                  isCritical
                    ? "bg-red-600 hover:bg-red-700"
                    : isUrgent
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                }`}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
