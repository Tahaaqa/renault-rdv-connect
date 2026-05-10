import type {
  BackendAgency,
  BackendAppointment,
  BackendComplaint,
  BackendNotification,
  BackendUser,
  BackendVehicle,
} from "@/backend/domain";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status}`) as Error & {
      status?: number;
      payload?: unknown;
    };
    error.status = response.status;
    try {
      error.payload = await response.json();
    } catch {}
    throw error;
  }

  return (await response.json()) as T;
}

export function listAgencies() {
  return requestJson<{ agencies: BackendAgency[] }>("/api/agencies");
}

export function createAgency(input: {
  name: string;
  city: string;
  address: string;
  phone: string;
  location?: BackendAgency["location"];
}) {
  return requestJson<{ agency: BackendAgency }>("/api/agencies", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAgency(
  id: string,
  input: {
    name?: string;
    city?: string;
    address?: string;
    phone?: string;
    location?: BackendAgency["location"];
  },
) {
  return requestJson<{ agency: BackendAgency }>(`/api/agencies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listClients() {
  return requestJson<{ clients: BackendUser[] }>("/api/clients");
}

export function listUsers() {
  return requestJson<{ users: BackendUser[] }>("/api/users");
}

export function updateUser(
  id: string,
  input: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    roles?: BackendUser["roles"];
    agencyId?: string | null;
  },
) {
  return requestJson<{ user: BackendUser }>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listVehicles() {
  return requestJson<{ vehicles: BackendVehicle[] }>("/api/vehicles");
}

export function createVehicle(input: {
  ownerUserId?: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  isPrimary?: boolean;
}) {
  return requestJson<{ vehicle: BackendVehicle }>("/api/vehicles", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateVehicle(
  id: string,
  input: {
    plateNumber?: string;
    brand?: string;
    model?: string;
    year?: number;
    isPrimary?: boolean;
  },
) {
  return requestJson<{ vehicle: BackendVehicle }>(`/api/vehicules/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteVehicle(id: string) {
  return requestJson<{ ok: true }>(`/api/vehicules/${id}`, {
    method: "DELETE",
  });
}

export function listAppointments() {
  return requestJson<{ appointments: BackendAppointment[] }>("/api/appointments");
}

export function createAppointment(input: {
  clientUserId?: string;
  agencyId: string;
  vehicleId: string;
  startsAt: string;
  servicesSelectionnes: string[];
  notesLibres?: string | null;
}) {
  return requestJson<{ appointment: BackendAppointment }>("/api/appointments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function cancelAppointment(id: string) {
  return requestJson<{ appointment: BackendAppointment }>(`/api/rdv/${id}/annuler`, {
    method: "PATCH",
  });
}

export function modifyAppointment(
  id: string,
  input: {
    startsAt?: string;
    servicesSelectionnes?: string[];
    notesLibres?: string | null;
  },
) {
  return requestJson<{ appointment: BackendAppointment }>(`/api/rdv/${id}/modifier`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function scanPlate(image: File) {
  const formData = new FormData();
  formData.append("image", image);
  const response = await fetch("/api/ocr/plaque", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status}`) as Error & {
      status?: number;
      payload?: unknown;
    };
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload as { immatriculation: string; confidence: number };
}

export function updateAppointmentStatus(id: string, status: BackendAppointment["status"]) {
  return requestJson<{ appointment: BackendAppointment }>(`/api/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function listComplaints() {
  return requestJson<{ complaints: BackendComplaint[] }>("/api/complaints");
}

export function createComplaint(input: {
  clientUserId?: string;
  appointmentId?: string | null;
  description: string;
}) {
  return requestJson<{ complaint: BackendComplaint }>("/api/complaints", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateComplaint(
  id: string,
  input: { status: BackendComplaint["status"]; resolution?: string | null },
) {
  return requestJson<{ complaint: BackendComplaint }>(`/api/complaints/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listNotifications() {
  return requestJson<{ notifications: BackendNotification[] }>("/api/notifications");
}

export function markNotificationsRead() {
  return requestJson<{ ok: true }>("/api/notifications", {
    method: "POST",
  });
}
