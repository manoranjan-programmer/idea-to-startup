const Groq = require("groq-sdk");
const dotenv = require("dotenv");
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

(async () => {
  try {
    const models = await groq.models.list();
    console.log("✅ AVAILABLE MODELS FOR THIS KEY:\n");

    models.data.forEach((m) => {
      console.log("-", m.id);
    });
  } catch (err) {
    console.error("❌ Failed to list models:", err.message);
  }
})();
