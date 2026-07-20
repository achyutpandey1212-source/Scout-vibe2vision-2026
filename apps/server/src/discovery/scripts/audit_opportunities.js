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
    recentOpps.forEach((opp, _i) => {
      console.log(`${_i + 1}.`);
      console.log(`   Title:             ${opp.title}`);
      console.log(`   Company:           ${opp.organization || 'N/A'}`);
      console.log(`   Location:          ${opp.location || 'N/A'}`);
      console.log(`   Work Mode:         ${opp.workMode || 'N/A'}`);
      console.log(`   Application URL:   ${opp.applicationUrl}`);
      console.log(`   Deadline:          ${opp.deadline || 'N/A'}`);
      console.log(`   Quality Score:     ${opp.opportunityScore || opp.qualityScore || 'N/A'}`);
      console.log(`   Gold Opportunity?: ${opp.goldOpportunity ? '★ YES' : 'NO'}`);
      console.log(`   Source:            ${opp.sourceDomain || 'N/A'}`);
      console.log(`   Discovery Date:    ${opp.createdAt || 'N/A'}`);
      console.log(`------------------------------------------------------`);
    });
  }

  // Aggregate Top Sources
  const topSources = await Opportunity.aggregate([
    { $match: { archived: { $ne: true } } },
    { $group: { _id: '$sourceDomain', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  // Aggregate Top Queries
  const topQueries = await Opportunity.aggregate([
    { $match: { archived: { $ne: true }, query: { $ne: null } } },
    { $group: { _id: '$query', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  // Aggregate Top Companies
  const topCompanies = await Opportunity.aggregate([
    { $match: { archived: { $ne: true }, organization: { $ne: null } } },
    { $group: { _id: '$organization', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  // Aggregate Lowest Quality Opportunities
  const lowestQuality = await Opportunity.find({ archived: { $ne: true } })
    .sort({ opportunityScore: 1, qualityScore: 1 })
    .limit(5)
    .lean();

  console.log(`\n======================================================`);
  console.log(`                DISCOVERY METRICS STATISTICS          `);
  console.log(`======================================================`);

  console.log(`\nTop Sources:`);
  topSources.forEach((s) => console.log(`   - ${s._id || 'Unknown'}: ${s.count} opportunities`));

  console.log(`\nTop Queries:`);
  topQueries.forEach((q) => console.log(`   - ${q._id}: ${q.count} opportunities`));

  console.log(`\nTop Companies:`);
  topCompanies.forEach((c) => console.log(`   - ${c._id}: ${c.count} opportunities`));

  console.log(`\nLowest Quality Opportunities:`);
  lowestQuality.forEach((opp) => {
    console.log(
      `   - ${opp.title} at ${opp.organization || 'N/A'} (Score: ${opp.opportunityScore || opp.qualityScore || 'N/A'})`,
    );
  });
  console.log(`======================================================\n`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(`Audit Script Failure:`, err);
  await mongoose.disconnect();
});
