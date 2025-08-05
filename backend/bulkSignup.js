
  const axios = require("axios");
const fs = require("fs");
const path = require("path");

const USERS_CSV = path.join(__dirname, "Users.csv");
const csv = require("csv-parser");

const users = [];

fs.createReadStream(USERS_CSV)
  .pipe(csv())
  .on("data", (data) => users.push(data))
  .on("end", async () => {
    console.log(`Found ${users.length} users. Attempting signup...`);

    for (const user of users) {
      try {
        await axios.post("http://localhost:5000/api/auth/signup", user);
        console.log(`✅ Signed up: ${user.email}`);
      } catch (error) {
        console.log(`❌ Failed to sign up: ${user.email} ${error.message}`);
      }
    }

    console.log("✅ Bulk signup completed.");
  });
