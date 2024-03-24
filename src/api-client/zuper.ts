const BASE_URL =
  "https://app.zuperpro.com/api/jobs?filter.category=52b28dd0-a3cd-11ed-a274-7d193e174a66";

interface JobStatus {
  status_name: string;
}

interface JobUser {
  user: {
    first_name: string;
    last_name: string;
  };
}

interface ServiceDetails {
  job_title: string;
  assigned_to: JobUser[];
  current_job_status: JobStatus;
  actual_end_time: string;
  job_uid: string;
}

export interface GetServiceData {
  type: string;
  data: ServiceDetails[];
  total_records: number;
  current_page: number;
  total_pages: number;
}

const getService = async (
  orderNumber: string | null,
): Promise<GetServiceData> => {
  const response = await fetch(`${BASE_URL}&filter.keyword=${orderNumber}`, {
    headers: {
      "X-Api-Key": "3fad764e9e653468d1d4eb47e11582b1",
    },
  });
  return response.json();
};

export default getService;
