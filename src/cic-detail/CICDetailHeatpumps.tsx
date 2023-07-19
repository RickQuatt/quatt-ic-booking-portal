import React from "react";
import { AdminCic } from "../api-client/models";
import { Accordion, AccordionItem } from "../ui-components/accordion/Accordion";
import {
  FormField,
  FormFieldTitle,
  FormFieldValue,
  FormSection,
} from "../ui-components/form/Form";
import classes from "./CICDetail.module.css";
import { CICDetailSectionHeader } from "./CICDetailSectionHeader";

export function CICDetailHeatpumps({ cicData }: { cicData: AdminCic }) {
  return (
    <div className={classes["detail-section"]}>
      <CICDetailSectionHeader title="Heat pumps" />
      <FormSection>
        <FormField>
          <FormFieldTitle>Number of heat pumps</FormFieldTitle>
          <FormFieldValue value={cicData.numberOfHeatPumps} />
        </FormField>
        <FormField>
          <FormFieldTitle>Is HP1 connected</FormFieldTitle>
          <FormFieldValue value={cicData.isHp1Connected} />
        </FormField>
        <FormField>
          <FormFieldTitle>Is HP2 connected</FormFieldTitle>
          <FormFieldValue value={cicData.isHp1Connected} />
        </FormField>
        <FormField>
          <FormFieldTitle>Use pricing to limit heat pump</FormFieldTitle>
          <FormFieldValue value={cicData.usePricingToLimitHeatPump} />
        </FormField>

        <Accordion>
          {cicData.heatPumps.map((heatpump, index) => (
            <CICDetailHeatpump
              key={index}
              heatpump={heatpump}
              index={index + 1}
            />
          ))}
        </Accordion>
      </FormSection>
    </div>
  );
}

function CICDetailHeatpump({
  index,
  heatpump,
}: {
  index: number;
  heatpump: AdminCic["heatPumps"][0];
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <AccordionItem
      title={`Heat pump ${index}`}
      isOpen={isOpen}
      onChangeIsOpen={() => setIsOpen(!isOpen)}
    >
      <FormSection>
        <FormField>
          <FormFieldTitle>Status</FormFieldTitle>
          <FormFieldValue value={heatpump.status} />
        </FormField>
        <FormField>
          <FormFieldTitle>Silent mode status</FormFieldTitle>
          <FormFieldValue value={heatpump.silentModeStatus} />
        </FormField>
        <FormField>
          <FormFieldTitle>Mod bus slave ID</FormFieldTitle>
          <FormFieldValue value={heatpump.modbusSlaveId} />
        </FormField>
        <FormField>
          <FormFieldTitle>Water pump level</FormFieldTitle>
          <FormFieldValue value={heatpump.waterPumpLevel} />
        </FormField>
        <FormField>
          <FormFieldTitle>Power</FormFieldTitle>
          <FormFieldValue value={heatpump.power} />
        </FormField>
        <FormField>
          <FormFieldTitle>Electrical power</FormFieldTitle>
          <FormFieldValue value={heatpump.electricalPower} />
        </FormField>
        <FormField>
          <FormFieldTitle>Rated power</FormFieldTitle>
          <FormFieldValue value={heatpump.ratedPower} />
        </FormField>
        <FormField>
          <FormFieldTitle>Minimum power</FormFieldTitle>
          <FormFieldValue value={heatpump.minimumPower} />
        </FormField>
        <FormField>
          <FormFieldTitle>Expected power</FormFieldTitle>
          <FormFieldValue value={heatpump.expectedPower} />
        </FormField>
        <FormField>
          <FormFieldTitle>Temperature water in</FormFieldTitle>
          <FormFieldValue value={heatpump.temperatureWaterIn} />
        </FormField>
        <FormField>
          <FormFieldTitle>Temperature water out</FormFieldTitle>
          <FormFieldValue value={heatpump.temperatureWaterOut} />
        </FormField>
        <FormField>
          <FormFieldTitle>Temperature outside</FormFieldTitle>
          <FormFieldValue value={heatpump.temperatureOutside} />
        </FormField>
        <FormField>
          <FormFieldTitle>Compressor frequency demand</FormFieldTitle>
          <FormFieldValue value={heatpump.compressorFrequencyDemand} />
        </FormField>
        <FormField>
          <FormFieldTitle>Compressor frequency</FormFieldTitle>
          <FormFieldValue value={heatpump.compressorFrequency} />
        </FormField>
      </FormSection>
    </AccordionItem>
  );
}
