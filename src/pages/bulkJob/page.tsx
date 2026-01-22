import { useState } from "react";
import { motion } from "framer-motion";
import { fadeInVariants } from "@/lib/animations";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import type { components } from "@/openapi-client/types/api/v1";
import { BulkJobForm } from "./components/BulkJobForm";
import { BulkJobSuccessCard } from "./components/BulkJobSuccessCard";

type BulkJobResponse = components["schemas"]["BulkJobResponse"];

export function BulkJobPage() {
  const [successData, setSuccessData] = useState<BulkJobResponse | null>(null);

  return (
    <motion.div
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
      className="container mx-auto space-y-6 p-6"
    >
      <PageHeader
        title="Bulk Jobs"
        subtitle="Submit bulk operations for installations (Backend only)"
      />

      <Card className="mx-auto max-w-3xl">
        <CardContent className="pt-6">
          <BulkJobForm onSuccess={setSuccessData} />
          {successData && <BulkJobSuccessCard data={successData} />}
        </CardContent>
      </Card>
    </motion.div>
  );
}
