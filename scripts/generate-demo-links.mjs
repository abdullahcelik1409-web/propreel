import { buildDemoUrl } from "../lib/marketing/demoConfig.js";

const links = [
  buildDemoUrl({
    source: "cold_email",
    medium: "outbound",
    campaign: "realtors_us_demo",
    content: "standard_demo",
  }),
  buildDemoUrl({
    source: "cold_email",
    medium: "outbound",
    campaign: "realtors_us_demo",
    content: "luxury_demo",
  }),
  buildDemoUrl({
    source: "cold_email",
    medium: "outbound",
    campaign: "photographers_partner_demo",
    content: "partner_demo",
  }),
  buildDemoUrl({
    source: "cold_email",
    medium: "outbound",
    campaign: "brokers_demo",
    content: "broker_demo",
  }),
];

for (const link of links) {
  console.log(link);
}
