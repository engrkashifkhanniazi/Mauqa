// Newspaper pipeline: OFF by default. Enable only after written permission from each publisher.
if (process.env.NEWSPAPER_PIPELINE_ENABLED !== "true") { console.log("newspaper pipeline disabled (NEWSPAPER_PIPELINE_ENABLED != true)"); process.exit(0); }
// Intentionally unimplemented: when enabled, fetch edition page images in memory only, send crops to Claude for structured facts,
// store facts + link to the publisher page, and NEVER store or republish page images or ad text.
console.error("newspaper pipeline not implemented yet"); process.exit(1);
