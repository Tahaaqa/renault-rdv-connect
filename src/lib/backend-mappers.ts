import type {
  BackendAgency,
  BackendAppointment,
  BackendComplaint,
  BackendUser,
  BackendVehicle,
} from "@/backend/domain";
import type { Agence, Client, Reclamation, RendezVous, Vehicule } from "@/types";

export function mapAgency(agency: BackendAgency): Agence {
  return {
    id: agency.id,
    nom: agency.name,
    ville: agency.city,
    adresse: agency.address,
    telephone: agency.phone,
    latitude: agency.location?.lat,
    longitude: agency.location?.lng,
  };
}

export function mapVehicle(vehicle: BackendVehicle): Vehicule {
  return {
    id: vehicle.id,
    clientId: vehicle.ownerUserId,
    immatriculation: vehicle.plateNumber,
    marque: vehicle.brand,
    modele: vehicle.model,
    annee: vehicle.year,
    isPrincipal: vehicle.isPrimary,
  };
}

export function mapUserClient(user: BackendUser): Client {
  const emailName = user.email.split("@")[0] || "Client";
  return {
    id: user.id,
    nom: user.lastName ?? emailName,
    prenom: user.firstName ?? "",
    email: user.email,
    telephone: user.phone ?? "",
  };
}

export function mapAppointment(appointment: BackendAppointment): RendezVous {
  return {
    id: appointment.id,
    reference: appointment.reference,
    clientId: appointment.clientUserId,
    agenceId: appointment.agencyId,
    vehiculeId: appointment.vehicleId,
    date: appointment.startsAt,
    statut: appointment.status,
    servicesSelectionnes: appointment.servicesSelectionnes ?? [],
    notesLibres: appointment.notesLibres ?? undefined,
    createdAt: appointment.createdAt,
    agentCreateurId: appointment.createdByUserId ?? undefined,
  };
}

export function mapComplaint(complaint: BackendComplaint): Reclamation {
  return {
    id: complaint.id,
    clientId: complaint.clientUserId,
    rdvId: complaint.appointmentId ?? undefined,
    description: complaint.description,
    statut: complaint.status,
    resolution: complaint.resolution ?? undefined,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
  };
}
