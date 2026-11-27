process.env.NEXT_TELEMETRY_DISABLED = "1";
process.argv[1] = "next";
await import("../node_modules/next/dist/bin/next");
