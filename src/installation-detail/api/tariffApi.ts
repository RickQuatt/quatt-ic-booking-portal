import { auth } from "../../firebase";
import { CreateUpdateEnergyTariff } from "../../api-client/models";

interface ApiErrorResponse {
  result?: {
    error?: string;
  };
}

const getAuthToken = async (): Promise<string> => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error("Authentication token not available");
  }
  return token;
};

const handleApiError = async (response: Response): Promise<never> => {
  try {
    const errorData: ApiErrorResponse = await response.json();
    throw new Error(
      `HTTP ${response.status}: ${errorData.result?.error || response.statusText}`,
    );
  } catch (parseError) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
};

export const createTariffForInstallation = async (
  installationId: string,
  tariffData: CreateUpdateEnergyTariff,
): Promise<void> => {
  const token = await getAuthToken();

  const requestBody = {
    validFrom: tariffData.validFrom.toISOString().substring(0, 10), // Format as YYYY-MM-DD
    electricity: tariffData.electricity,
    gas: tariffData.gas,
  };

  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_PATH}/admin/installation/${installationId}/tariff`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    await handleApiError(response);
  }
};

export const updateTariffForInstallation = async (
  installationId: string,
  tariffId: string,
  tariffData: CreateUpdateEnergyTariff,
): Promise<void> => {
  const token = await getAuthToken();

  const requestBody = {
    validFrom: tariffData.validFrom.toISOString().substring(0, 10), // Format as YYYY-MM-DD
    electricity: tariffData.electricity,
    gas: tariffData.gas,
  };

  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_PATH}/admin/installation/${installationId}/tariff/${tariffId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    await handleApiError(response);
  }
};
