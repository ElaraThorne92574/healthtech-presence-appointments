import { z } from "zod";

export const appointmentRequest = z.object({
  appointmentId: z.string().min(1),
  patientId: z.string().min(1),
  clinicianId: z.string().min(1),
  status: z.enum(["scheduled", "checked-in", "completed"])
});

export type AppointmentRequest = z.infer<typeof appointmentRequest>;

export type PresenceUser = { id: string; online: boolean };

export function chooseNotification(input: AppointmentRequest, presence: PresenceUser[]): string | null {
  const clinician = presence.find((user) => user.id === input.clinicianId);
  if (input.status === "checked-in" && clinician?.online === true) {
    return `appointment.${input.appointmentId}.ready`;
  }
  return null;
}
