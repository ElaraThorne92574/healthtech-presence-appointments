import { chooseNotification, appointmentRequest } from "./appointment_notifications.ts";
import { InfraiRealtimeClient } from "./infrai_realtime_client.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before starting the service");

const input = appointmentRequest.parse({
  appointmentId: process.env.APPOINTMENT_ID ?? "apt-demo-42",
  patientId: process.env.PATIENT_ID ?? "patient-demo-7",
  clinicianId: process.env.CLINICIAN_ID ?? "clinician-demo-3",
  status: "checked-in"
});
const client = new InfraiRealtimeClient(key);
const presence = await client.getPresence("healthtech-workspace");
const event = chooseNotification(input, presence.members);
if (event) {
  await client.publish("healthtech-workspace", event, { appointmentId: input.appointmentId, patientId: input.patientId }, process.env.INFRAI_ACCOUNT_ID ?? "healthtech-demo");
}
console.log(JSON.stringify({ appointmentId: input.appointmentId, clinicianOnline: presence.members.some((user) => user.id === input.clinicianId && user.online), notification: event ?? "none" }));
