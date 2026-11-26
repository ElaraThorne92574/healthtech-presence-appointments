import assert from "node:assert/strict";
import { test } from "node:test";
import { chooseNotification, appointmentRequest } from "./appointment_notifications.ts";

test("checked-in appointment notifies only when its clinician is online", () => {
  const input = appointmentRequest.parse({ appointmentId: "apt-1", patientId: "p-1", clinicianId: "c-1", status: "checked-in" });
  assert.equal(chooseNotification(input, [{ id: "c-1", online: true }]), "appointment.apt-1.ready");
  assert.equal(chooseNotification(input, [{ id: "c-1", online: false }]), null);
});
