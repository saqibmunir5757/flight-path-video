const { getRenderProgress } = require("@remotion/lambda/client");

const REGION = "ap-south-1";
const BUCKET_NAME = "remotionlambda-apsouth1-q29v20bgvr";

module.exports = async (req, res) => {
  const { jobId } = req.query;

  if (!jobId) {
    return res.status(400).json({ error: "jobId required" });
  }

  try {
    const progress = await getRenderProgress({
      renderId: jobId,
      bucketName: BUCKET_NAME,
      functionName: "remotion-render-4-0-427-mem2048mb-disk2048mb-120sec",
      region: REGION,
    });

    if (progress.done) {
      return res.status(200).json({
        status: "done",
        phase: "Complete!",
        percent: 100,
        outputFile: progress.outKey,
        outputUrl: `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${progress.outKey}`,
      });
    }

    if (progress.fatalErrorEncountered) {
      return res.status(200).json({
        status: "error",
        phase: "Failed",
        percent: 0,
        error: progress.errors[0]?.message || "Render failed",
      });
    }

    const percent = Math.round((progress.overallProgress || 0) * 100);
    return res.status(200).json({
      status: "running",
      phase: `Rendering... ${percent}%`,
      percent,
      framesRendered: progress.framesRendered || 0,
    });
  } catch (err) {
    console.error("[Status Check] Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
