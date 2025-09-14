/**
 * TypeScript module augmentation for OpenAPI Generator enum bugs
 *
 * The OpenAPI generator has a naming inconsistency bug where it:
 * 1. Creates enum definitions with "Operation" in the name:
 *    - AdminRebootDeviceOperationXClientPlatformEnum
 *    - SendCommandToCICOperationXClientPlatformEnum
 *
 * 2. But references them in interfaces WITHOUT "Operation":
 *    - AdminRebootDeviceXClientPlatformEnum (in AdminRebootDeviceOperationRequest)
 *    - SendCommandToCICXClientPlatformEnum (in SendCommandToCICOperationRequest)
 *
 * This mismatch was made apparent after the API client regeneration (commit 17096be)
 * where the generator "fixed" the interface references to use the shorter names,
 * but the actual enum definitions still use the longer "Operation" names.
 *
 * Without these patches, TypeScript cannot resolve the enum types referenced in
 * the interfaces, even though the application currently doesn't use these optional
 * xClientPlatform parameters. The patches ensure type consistency for future use.
 *
 * This file uses module augmentation to add the missing enum declarations
 * to the generated module without modifying the auto-generated file directly.
 */

import "./apis/SupportDashboardApi";

declare module "./apis/SupportDashboardApi" {
  // Add the missing enum constants that are referenced but not declared
  export const AdminRebootDeviceXClientPlatformEnum: typeof AdminRebootDeviceOperationXClientPlatformEnum;
  export const SendCommandToCICXClientPlatformEnum: typeof SendCommandToCICOperationXClientPlatformEnum;

  // Add the missing type aliases
  export type AdminRebootDeviceXClientPlatformEnum =
    AdminRebootDeviceOperationXClientPlatformEnum;
  export type SendCommandToCICXClientPlatformEnum =
    SendCommandToCICOperationXClientPlatformEnum;
}
