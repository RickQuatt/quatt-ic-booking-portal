import { motion } from "framer-motion";
import { fadeInVariants } from "@/lib/animations";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReferralRockEmailCard } from "./components/ReferralRockEmailCard";

export function UtilitiesPage() {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
      className="container mx-auto space-y-6 p-6"
    >
      <PageHeader
        title="Utilities"
        subtitle="Support utilities and admin tools"
      />

      <div className="mx-auto max-w-3xl">
        <ReferralRockEmailCard />
      </div>
    </motion.div>
  );
}
