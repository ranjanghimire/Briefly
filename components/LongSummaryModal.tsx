"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

export function LongSummaryModal(props: {
  open: boolean;
  onClose: () => void;
  title?: string | null;
  long_summary: string;
  source?: string | null;
  publishedAt?: string | null;
  url?: string | null;
}) {
  return (
    <AnimatePresence>
      {props.open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={props.onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] overflow-hidden rounded-[20px] bg-white p-6 shadow-[0_20px_70px_rgba(0,0,0,0.16)]"
            initial={{ scale: 0.98, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            {/* Scrollable content wrapper */}
            <div className="max-h-[70vh] overflow-y-auto pr-1">
              <div className="text-[15.5px] leading-relaxed text-[color:theme(colors.briefly.secondary)]">
                {props.long_summary}
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div className="text-[12.5px] text-[color:theme(colors.briefly.meta)]">
                {props.source ? <span>{props.source}</span> : null}
                {props.source && props.publishedAt ? (
                  <span className="mx-2">·</span>
                ) : null}
                {props.publishedAt ? (
                  <span>{new Date(props.publishedAt).toLocaleString()}</span>
                ) : null}
              </div>

              {props.url ? (
                <Link
                  href={props.url}
                  target="_blank"
                  className="text-[12.5px] text-[color:theme(colors.briefly.meta)] underline decoration-[color:theme(colors.briefly.line)] underline-offset-4 hover:text-black"
                >
                  Read full article
                </Link>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
