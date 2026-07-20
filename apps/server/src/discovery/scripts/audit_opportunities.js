/* global require, __dirname, process, console */
/* eslint-disable @typescript-eslint/no-require-imports */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scout';
  console.log(`Connecting to database...`);
  await mongoose.connect(uri);

  const OpportunitySchema = new mongoose.Schema({}, { strict: false });
  const Opportunity =
    mongoose.models.Opportunity ||
    mongoose.model('Opportunity', OpportunitySchema, 'opportunities');

  const recentOpps = await Opportunity.find({ archived: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  console.log(`\n======================================================`);
  console.log(`        RECENT ACCEPTED OPPORTUNITIES AUDIT           `);
  console.log(`======================================================\n`);

  if (recentOpps.length === 0) {
    console.log(`No active opportunities found in database.`);
  } else {
    recentOpps.forEach((opp, i) => {
      console.log(`${i + 1}.`);
      console.log(`   Title:             ${opp.title}`);
      console.log(`   Company:           ${opp.organization || 'N/A'}`);
      console.log(`   Location:          ${opp.location || 'N/A'}`);
      console.log(`   Work Mode:         ${opp.workMode || 'N/A'}`);
      console.log(`   Application URL:   ${opp.applicationUrl}`);
      console.log(`   Deadline:          ${opp.deadline || 'N/A'}`);
      console.log(`   Quality Score:     ${opp.opportunityScore || opp.qualityScore || 'N/A'}`);
      console.log(`   Gold Opportunity?: ${opp.goldOpportunity ? '★ YES' : 'NO'}`);
      console.log(`   Source:            ${opp.sourceDomain || 'N/A'}`);
      console.log(`------------------------------------------------------`);
    });
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(`Audit Script Failure:`, err);
  await mongoose.disconnect();
});
