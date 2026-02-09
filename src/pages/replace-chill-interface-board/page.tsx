import { useMemo } from "react";
import { useSearch } from "wouter";
import { motion } from "framer-motion";
import { fadeInVariants } from "@/lib/animations";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReplaceChillInterfaceBoardForm } from "./components/ReplaceChillInterfaceBoardForm";

export function ReplaceChillInterfaceBoardPage() {
  const searchString = useSearch();

  const queryParams = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return {
      installationUuid: params.get("installationUuid") || "",
      deviceUuid: params.get("deviceUuid") || "",
    };
  }, [searchString]);

  return (
    <motion.div
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
      className="container mx-auto space-y-6 p-6"
    >
      <PageHeader
        title="Replace Chill Interface Board"
        subtitle="Deactivate the current interface board on a chill device and activate a new one from inventory"
      />

      <div className="mx-auto max-w-3xl">
        <ReplaceChillInterfaceBoardForm
          defaultInstallationUuid={queryParams.installationUuid}
          defaultDeviceUuid={queryParams.deviceUuid}
        />
      </div>
    </motion.div>
  );
}
