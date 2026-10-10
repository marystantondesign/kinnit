import { motion } from "motion/react";

interface ConditionalFollowUpProps {
  show: boolean;
  children: React.ReactNode;
}

export function ConditionalFollowUp({ show, children }: ConditionalFollowUpProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200"
    >
      {children}
    </motion.div>
  );
}
