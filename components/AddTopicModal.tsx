"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export function AddTopicModal(props: {
  open: boolean;
  onClose: () => void;
  onCreate: (topic: string) => void;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (props.open) setValue("");
  }, [props.open]);

  const cleaned = useMemo(() => value.trim().replace(/\s+/g, " "), [value]);

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
            className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-[0_20px_70px_rgba(0,0,0,0.16)]"
            initial={{ scale: 0.98, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <div className="text-[15px] font-medium text-black">Add topic</div>
            <div className="mt-4">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. SpaceX, Bitcoin, Climate"
                className="w-full rounded-2xl border border-[color:theme(colors.briefly.line)] bg-white px-4 py-3 text-[15px] outline-none focus:border-[color:theme(colors.briefly.accent)]"
                autoFocus
              />
              <div className="mt-2 text-[12.5px] text-[color:theme(colors.briefly.meta)]">
                Keep it short and specific.
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={props.onClose}
                className="rounded-full px-4 py-2 text-[14px] text-[color:theme(colors.briefly.meta)] hover:text-black"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!cleaned) return;
                  props.onCreate(cleaned);
                  props.onClose();
                }}
                className={[
                  "rounded-full px-5 py-2 text-[14px] text-white transition",
                  cleaned
                    ? "bg-[color:theme(colors.briefly.accent)]"
                    : "bg-black/20"
                ].join(" ")}
                disabled={!cleaned}
              >
                Create
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

